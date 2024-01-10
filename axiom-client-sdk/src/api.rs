use std::sync::{Arc, Mutex};

use axiom_client::{
    axiom_codec::HiLo,
    axiom_eth::{
        halo2_base::{gates::RangeChip, AssignedValue, Context},
        rlc::circuit::builder::RlcCircuitBuilder,
    },
    subquery::caller::SubqueryCaller,
    utils::{from_hi_lo, to_hi_lo},
};
use ethers::providers::Http;

use crate::{
    subquery::{
        account::{get_account, Account},
        header::{get_header, Header},
        mapping::{get_mapping, SolidityMapping},
        receipt::{get_receipt, Receipt},
        storage::{get_storage, Storage},
        tx::{get_tx, Tx},
    },
    Fr,
};

pub struct AxiomAPI<'a> {
    pub builder: &'a mut RlcCircuitBuilder<Fr>,
    pub range: &'a RangeChip<Fr>,
    pub subquery_caller: Arc<Mutex<SubqueryCaller<Http, Fr>>>,
}

impl<'a> AxiomAPI<'a> {
    pub fn new(
        builder: &'a mut RlcCircuitBuilder<Fr>,
        range: &'a RangeChip<Fr>,
        subquery_caller: Arc<Mutex<SubqueryCaller<Http, Fr>>>,
    ) -> Self {
        Self {
            builder,
            range,
            subquery_caller,
        }
    }

    pub fn subquery_caller(&self) -> Arc<Mutex<SubqueryCaller<Http, Fr>>> {
        self.subquery_caller.clone()
    }

    pub fn ctx(&mut self) -> &mut Context<Fr> {
        self.builder.base.main(0)
    }

    pub fn from_hi_lo(&mut self, hilo: HiLo<AssignedValue<Fr>>) -> AssignedValue<Fr> {
        let ctx = self.builder.base.main(0);
        from_hi_lo(ctx, self.range, hilo)
    }

    pub fn to_hi_lo(&mut self, val: AssignedValue<Fr>) -> HiLo<AssignedValue<Fr>> {
        let ctx = self.builder.base.main(0);
        to_hi_lo(ctx, self.range, val)
    }

    pub fn get_account(
        &mut self,
        block_number: AssignedValue<Fr>,
        addr: AssignedValue<Fr>,
    ) -> Account {
        let ctx = self.builder.base.main(0);
        get_account(ctx, self.subquery_caller.clone(), block_number, addr)
    }

    pub fn get_header(&mut self, block_number: AssignedValue<Fr>) -> Header {
        let ctx = self.builder.base.main(0);
        get_header(ctx, self.subquery_caller.clone(), block_number)
    }

    pub fn get_mapping(
        &mut self,
        block_number: AssignedValue<Fr>,
        addr: AssignedValue<Fr>,
        mapping_slot: HiLo<AssignedValue<Fr>>,
    ) -> SolidityMapping {
        let ctx = self.builder.base.main(0);
        get_mapping(
            ctx,
            self.subquery_caller.clone(),
            block_number,
            addr,
            mapping_slot,
        )
    }

    pub fn get_receipt(
        &mut self,
        block_number: AssignedValue<Fr>,
        tx_idx: AssignedValue<Fr>,
    ) -> Receipt {
        let ctx = self.builder.base.main(0);
        get_receipt(ctx, self.subquery_caller.clone(), block_number, tx_idx)
    }

    pub fn get_storage(
        &mut self,
        block_number: AssignedValue<Fr>,
        addr: AssignedValue<Fr>,
    ) -> Storage {
        let ctx = self.builder.base.main(0);
        get_storage(ctx, self.subquery_caller.clone(), block_number, addr)
    }

    pub fn get_tx(&mut self, block_number: AssignedValue<Fr>, tx_idx: AssignedValue<Fr>) -> Tx {
        let ctx = self.builder.base.main(0);
        get_tx(ctx, self.subquery_caller.clone(), block_number, tx_idx)
    }
}
