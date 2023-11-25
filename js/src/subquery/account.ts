import { AccountField, AccountSubquery, DataSubqueryType } from "@axiom-crypto/tools";
import { lowercase } from "../utils";
import { CircuitValue, CircuitValue256 } from "@axiom-crypto/halo2-lib-js";
import { getCircuitValueConstant } from "../utils";
import { prepData } from "./data";

type AccountEnumKeys = Uncapitalize<keyof typeof AccountField>;
type AccountEnumKeyFields = { [key in AccountEnumKeys]: () => Promise<CircuitValue256> };
export interface Account extends AccountEnumKeyFields { };

export const buildAccount = (blockNumber: CircuitValue, address: CircuitValue) => {

  const getSubquery = (fieldIdx: CircuitValue) => {
    let accountSubquery: AccountSubquery = {
      blockNumber: blockNumber.number(),
      addr: address.address(),
      fieldIdx: fieldIdx.number()
    };
    const dataSubquery = { subqueryData: accountSubquery, type: DataSubqueryType.Account }
    return prepData(dataSubquery, [blockNumber, address, fieldIdx]);
  }

  const functions = Object.fromEntries(
    Object.keys(AccountField).map((key) => {
      return [lowercase(key), () => {
        const accountField = getCircuitValueConstant(AccountField[key as keyof typeof AccountField])
        return getSubquery(accountField);
      }]
    })
  ) as Account;

  return Object.freeze(functions);
}
