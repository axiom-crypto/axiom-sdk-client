use axiom_eth::halo2_base::utils::ScalarField;
use axiom_eth::halo2_proofs::plonk::VerifyingKey;
use axiom_eth::halo2curves::ff::PrimeField;
use axiom_eth::halo2curves::serde::SerdeObject;
use axiom_eth::halo2curves::CurveAffine;
use axiom_eth::snark_verifier::system::halo2::transcript_initial_state;
use axiom_eth::Field;
use ethers::types::H256;
use std::io::{self};
use std::io::{Result, Write};

#[derive(Clone, Debug)]
pub struct PartialVerifyingKey<C: CurveAffine> {
    pub preprocessed: Vec<C>,
    pub transcript_initial_state: C::Scalar,
}

fn write_field_le<F: Field>(writer: &mut impl Write, fe: F) -> Result<()> {
    let repr = ScalarField::to_bytes_le(&fe);
    writer.write_all(&repr)?;
    Ok(())
}

fn write_curve_compressed<C: CurveAffine>(writer: &mut impl Write, point: C) -> Result<()> {
    let compressed = point.to_bytes();
    writer.write_all(compressed.as_ref())?;
    Ok(())
}

pub fn write_partial_vkey<C>(vkey: &PartialVerifyingKey<C>) -> io::Result<Vec<H256>>
where
    C: CurveAffine + SerdeObject,
    C::Scalar: Field + SerdeObject,
{
    let tmp = C::Repr::default();
    let compressed_curve_bytes = tmp.as_ref().len();
    let tmp = <C::Scalar as PrimeField>::Repr::default();
    let field_bytes = tmp.as_ref().len();
    let mut writer =
        Vec::with_capacity(field_bytes + vkey.preprocessed.len() * compressed_curve_bytes);
    write_field_le(&mut writer, vkey.transcript_initial_state)?;
    for &point in &vkey.preprocessed {
        write_curve_compressed(&mut writer, point)?;
    }
    Ok(writer.chunks_exact(32).map(H256::from_slice).collect())
}

pub fn get_partial_vk_from_vk<C: CurveAffine>(vk: &VerifyingKey<C>) -> PartialVerifyingKey<C> {
    let preprocessed = vk
        .fixed_commitments()
        .iter()
        .chain(vk.permutation().commitments().iter())
        .cloned()
        .map(Into::into)
        .collect();
    let transcript_initial_state = transcript_initial_state(vk);
    PartialVerifyingKey {
        preprocessed,
        transcript_initial_state,
    }
}
