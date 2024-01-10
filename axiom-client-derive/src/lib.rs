use input::{impl_flatten_and_raw_input, impl_new_struct};
use proc_macro::TokenStream;
use syn::{parse_macro_input, DeriveInput, FnArg, Ident, ItemFn, ItemStruct, Type, Visibility};

extern crate proc_macro;
extern crate syn;
#[macro_use]
extern crate quote;

mod input;

#[proc_macro_attribute]
#[allow(non_snake_case)]
pub fn AxiomComputeInput(_args: TokenStream, input: TokenStream) -> TokenStream {
    let input_clone = input.clone();
    let ast = parse_macro_input!(input_clone as ItemStruct);
    let new_struct = impl_new_struct(&ast);
    if let Err(err) = new_struct {
        return err.into();
    }
    let new_struct = new_struct.unwrap();
    let new_derive_input: TokenStream = new_struct.clone().into();
    let new_ast = parse_macro_input!(new_derive_input as DeriveInput);
    let flatten = impl_flatten_and_raw_input(&new_ast);
    quote! {
        #[derive(Debug, Clone, Default, serde::Serialize, serde::Deserialize)]
        #ast
        #new_struct
        #flatten
    }
    .into()
}

#[proc_macro_attribute]
#[allow(non_snake_case)]
pub fn AxiomCompute(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let input_fn = parse_macro_input!(item as ItemFn);

    let _fn_name = &input_fn.sig.ident;

    let mut trait_fn = input_fn.clone();
    trait_fn.sig.ident = Ident::new("compute", input_fn.sig.ident.span());
    trait_fn.vis = Visibility::Inherited;

    let fourth_input_type = if let Some(FnArg::Typed(pat_type)) = input_fn.sig.inputs.iter().nth(3)
    {
        match &*pat_type.ty {
            Type::Path(type_path) => type_path
                .path
                .segments
                .first()
                .expect("Type path should have at least one segment")
                .ident
                .to_string(),
            _ => panic!("Unsupported type format for the fourth input"),
        }
    } else {
        panic!("The function does not have a fourth input");
    };

    if !fourth_input_type.ends_with("CircuitInput") {
        panic!("The assigned input name must end with `CircuitInput`");
    }

    let input_name = fourth_input_type
        .trim_end_matches("CircuitInput")
        .to_string()
        + "Input";
    let input_name_ident = Ident::new(&input_name, input_fn.sig.ident.span());

    quote! {
        impl crate::compute::AxiomComputeFn for #input_name_ident {
            #trait_fn
        }
    }
    .into()
}
