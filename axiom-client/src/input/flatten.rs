use anyhow::Result;
use axiom_codec::HiLo;
use serde::{Deserialize, Serialize};

use crate::{impl_input_flatten_for_fixed_array, impl_input_flatten_for_tuple};

pub trait InputFlatten<T: Copy>: Sized {
    const NUM_FE: usize;
    fn flatten_vec(&self) -> Vec<T>;
    fn unflatten(vec: Vec<T>) -> Result<Self>;
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct FixLenVec<T: Copy, const N: usize> {
    pub vec: Vec<T>,
}

impl<T: Copy, const N: usize> FixLenVec<T, N> {
    pub fn new(vec: Vec<T>) -> anyhow::Result<Self> {
        if vec.len() != N {
            anyhow::bail!("Invalid input length: {} != {}", vec.len(), N);
        }
        Ok(FixLenVec { vec })
    }

    pub fn into_inner(self) -> Vec<T> {
        self.vec
    }
}

impl<T: Copy, const N: usize> From<Vec<T>> for FixLenVec<T, N> {
    fn from(vec: Vec<T>) -> Self {
        Self { vec }
    }
}

macro_rules! check_input_length {
    ($vec:ident) => {
        if $vec.len() != <Self as InputFlatten<T>>::NUM_FE {
            anyhow::bail!(
                "Invalid input length: {} != {}",
                $vec.len(),
                <Self as InputFlatten<T>>::NUM_FE
            );
        }
    };
}

impl<T: Copy, const N: usize> InputFlatten<T> for FixLenVec<T, N> {
    const NUM_FE: usize = N;
    fn flatten_vec(&self) -> Vec<T> {
        self.vec.clone()
    }
    fn unflatten(vec: Vec<T>) -> Result<Self> {
        check_input_length!(vec);
        Ok(FixLenVec { vec })
    }
}

impl<T: Copy> InputFlatten<T> for HiLo<T> {
    const NUM_FE: usize = 2;
    fn flatten_vec(&self) -> Vec<T> {
        vec![self.hi(), self.lo()]
    }
    fn unflatten(vec: Vec<T>) -> Result<Self> {
        check_input_length!(vec);
        Ok(HiLo::from_hi_lo([vec[0], vec[1]]))
    }
}

impl_input_flatten_for_tuple!(HiLo<T>, HiLo<T>);

impl<T: Copy> InputFlatten<T> for T {
    const NUM_FE: usize = 1;
    fn flatten_vec(&self) -> Vec<T> {
        vec![*self]
    }
    fn unflatten(vec: Vec<T>) -> Result<Self> {
        check_input_length!(vec);
        Ok(vec[0])
    }
}

impl_input_flatten_for_fixed_array!(T);
impl_input_flatten_for_fixed_array!(HiLo<T>);

#[macro_export]
macro_rules! impl_input_flatten_for_tuple {
    ($type1:ty, $type2:ty) => {
        impl<T: Copy> InputFlatten<T> for ($type1, $type2)
        where
            $type1: InputFlatten<T>,
            $type2: InputFlatten<T>,
        {
            const NUM_FE: usize = <$type1>::NUM_FE + <$type2>::NUM_FE;

            fn flatten_vec(&self) -> Vec<T> {
                let mut first_vec = self.0.flatten_vec();
                first_vec.extend(self.1.flatten_vec());
                first_vec
            }

            fn unflatten(vec: Vec<T>) -> anyhow::Result<Self> {
                check_input_length!(vec);
                let (first_part, second_part) = vec.split_at(<$type1>::NUM_FE);
                let first = <$type1>::unflatten(first_part.to_vec())?;
                let second = <$type2>::unflatten(second_part.to_vec())?;
                Ok((first, second))
            }
        }
    };
}

#[macro_export]
macro_rules! impl_input_flatten_for_fixed_array {
    ($type1:ty) => {
        impl<T: Copy, const N: usize> InputFlatten<T> for [$type1; N]
        where
            $type1: InputFlatten<T>,
        {
            const NUM_FE: usize = <$type1>::NUM_FE * N;

            fn flatten_vec(&self) -> Vec<T> {
                self.to_vec()
                    .iter()
                    .map(|x| x.flatten_vec())
                    .flatten()
                    .collect()
            }

            fn unflatten(vec: Vec<T>) -> anyhow::Result<Self> {
                check_input_length!(vec);
                let res = vec
                    .chunks(<$type1>::NUM_FE)
                    .into_iter()
                    .map(|x| <$type1>::unflatten(x.to_vec()).unwrap())
                    .collect::<Vec<_>>();
                let mut array = [res[0]; N];
                for (i, item) in res.into_iter().enumerate() {
                    array[i] = item;
                }
                Ok(array)
            }
        }
    };
}
