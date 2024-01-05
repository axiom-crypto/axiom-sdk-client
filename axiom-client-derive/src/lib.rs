use input::{impl_new_struct, impl_flatten_and_raw_input};
use proc_macro::TokenStream;
use syn::{parse_macro_input, DeriveInput, ItemStruct};

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
        #[derive(Debug, Clone, Default)]
        #ast
        #new_struct
        #flatten
    }
    .into()
}
