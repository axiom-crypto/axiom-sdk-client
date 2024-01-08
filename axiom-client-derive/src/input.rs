use proc_macro2::{Ident, Span, TokenStream};
use quote::ToTokens;
use syn::{parse_quote, Data, DeriveInput, GenericParam, Generics, ItemStruct};

pub fn impl_new_struct(ast: &ItemStruct) -> Result<TokenStream, TokenStream> {
    let name = &ast.ident;

    let ends_with_input = name.to_string().ends_with("Input");
    let name_prefix = name.to_string().trim_end_matches("Input").to_string();
    let circuit_input_name = format!("{}CircuitInput", name_prefix);
    let circuit_input_name_ident = Ident::new(&circuit_input_name, Span::call_site());

    if !ends_with_input {
        return Err(quote! {
            compile_error!("Struct must be named `_Input`. Ex: `ExampleInput`");
        });
    }

    let fields = ast.fields.clone();

    let field_types: Vec<_> = fields
        .iter()
        .map(|field| field.ty.to_token_stream())
        .collect();

    let field_names: Vec<_> = fields
        .iter()
        .map(|field| {
            if let Some(ref field) = field.ident {
                return field.to_token_stream();
            }
            quote! {
                compile_error!("AxiomComputeInput macro only supports named fields");
            }
        })
        .collect();

    let mut new_impl_generics = Generics::default();

    let copy_generic: GenericParam = parse_quote! { T: Copy };
    new_impl_generics.params.push(copy_generic);

    let existing_generics = ast.generics.clone();
    for param in existing_generics.params {
        new_impl_generics.params.push(param);
    }

    let input_struct_tokens: Vec<_> = field_names
        .iter()
        .zip(field_types.iter())
        .map(|(name, field_type)| {
            quote! {
                #name: <#field_type as axiom_client::input::raw_input::RawInput<crate::Fr>>::FEType<T>,
            }
        })
        .collect();

    Ok(quote! {
        // #original_struct
        #[derive(Debug, Clone)]
        pub struct #circuit_input_name_ident #new_impl_generics {
            #(#input_struct_tokens)*
        }
    })
}

pub fn impl_flatten_and_raw_input(ast: &DeriveInput) -> TokenStream {
    let name = &ast.ident;

    let raw_circuit_name = name
        .to_string()
        .trim_end_matches("CircuitInput")
        .to_string()
        + "Input";
    let raw_circuit_name_ident = Ident::new(&raw_circuit_name, Span::call_site());

    let fields = match ast.data {
        Data::Struct(ref data_struct) => &data_struct.fields,
        _ => {
            return quote! {
                compile_error!("CoreBuilderParams macro only supports structs");
            }
        }
    };

    let field_types: Vec<_> = fields
        .iter()
        .map(|field| field.ty.to_token_stream())
        .collect();

    let field_names: Vec<_> = fields
        .iter()
        .map(|field| {
            if let Some(ref field) = field.ident {
                return field.to_token_stream();
            }
            quote! {
                compile_error!("InputFlatten macro only supports named fields");
            }
        })
        .collect();

    let mut old_generics = Generics::default();
    for param in &ast.generics.params {
        match param {
            GenericParam::Type(type_param) => {
                if type_param.ident != "T" {
                    old_generics.params.push(param.clone());
                }
            }
            GenericParam::Const(type_param) => {
                if type_param.ident != "T" {
                    old_generics.params.push(param.clone());
                }
            }
            _ => {
                old_generics.params.push(param.clone());
            }
        }
    }

    let (old_impl_generics, old_ty_generics, _) = old_generics.split_for_impl();

    let (impl_generics, ty_generics, _) = ast.generics.split_for_impl();

    let mut new_generics = ast.generics.clone();
    for param in &mut new_generics.params {
        if let GenericParam::Type(type_param) = param {
            if type_param.ident == "T" {
                type_param.ident = parse_quote! { F };
                type_param.bounds = parse_quote! { axiom_client::axiom_eth::Field };
                break;
            }
        }
    }

    let (new_impl_generics, new_ty_generics, _) = new_generics.split_for_impl();

    let num_fe_tokens = field_types.iter().map(|ident| {
        quote! {
            <#ident as axiom_client::input::flatten::InputFlatten<T>>::NUM_FE
        }
    });
    let num_fe_tokens_clone = num_fe_tokens.clone();

    let flatten_tokens = field_names.iter().map(|ident| {
        quote! {
            self.#ident.flatten_vec(),
        }
    });

    let create_struct_tokens: Vec<_> = field_names
        .iter()
        .zip(field_types.iter())
        .enumerate()
        .map(|(index, (name, field_type))| {
            quote! {
                #name: <#field_type as axiom_client::input::flatten::InputFlatten<T>>::unflatten(segmented_fe[#index].clone())?,
            }
        })
        .collect();

    quote! {
        impl #impl_generics axiom_client::input::flatten::InputFlatten<T> for #name #ty_generics {
            const NUM_FE: usize = #(#num_fe_tokens + )* 0;
            fn flatten_vec(&self) -> Vec<T> {
                let flattened = vec![#(#flatten_tokens)*];
                flattened.into_iter().flatten().collect()
            }

            fn unflatten(vec: Vec<T>) -> anyhow::Result<Self> {
                if vec.len() != <Self as axiom_client::input::flatten::InputFlatten<T>>::NUM_FE {
                    anyhow::bail!(
                        "Invalid input length: {} != {}",
                        vec.len(),
                        <Self as axiom_client::input::flatten::InputFlatten<T>>::NUM_FE
                    );
                }

                let mut fe = vec.clone();
                let num_fe_per_field = vec![#(#num_fe_tokens_clone),*];

                let mut segmented_fe = Vec::<Vec<T>>::new();
                for num_fe in num_fe_per_field.iter() {
                    let new_vec = fe.drain(0..*num_fe).collect();
                    segmented_fe.push(new_vec);
                }

                Ok(#name {
                    #(#create_struct_tokens)*
                })
            }
        }

        impl #new_impl_generics axiom_client::input::raw_input::RawInput<F> for #raw_circuit_name_ident #old_ty_generics {
            type FEType<T: Copy> = #name #new_ty_generics;
            fn convert(&self) -> Self::FEType<F> {
                use axiom_client::input::raw_input::RawInput;
                #name {
                    #(#field_names: self.#field_names.convert(),)*
                }
            }
        }

        impl #new_impl_generics From<#raw_circuit_name_ident #old_ty_generics> for #name #new_ty_generics {
            fn from(input: #raw_circuit_name_ident #old_ty_generics) -> Self {
                use axiom_client::input::raw_input::RawInput;
                #name {
                    #(#field_names: input.#field_names.convert(),)*
                }
            }
        }

        impl #new_impl_generics Default for #name #new_ty_generics {
            fn default() -> Self {
                let raw: #raw_circuit_name_ident #old_ty_generics = Default::default();
                raw.into()
            }
        }

        impl #old_impl_generics crate::compute::AxiomComputeInput for #raw_circuit_name_ident #old_ty_generics {
            type LogicInput = #raw_circuit_name_ident #old_ty_generics;
            type Input<T: Copy> = #name #ty_generics;
        }

    }
}
