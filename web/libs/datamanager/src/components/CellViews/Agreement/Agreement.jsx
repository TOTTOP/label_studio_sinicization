import clsx from "clsx";
import { useSDK } from "../../../providers/SDKProvider";
import { cn } from "../../../utils/bem";
import { isDefined } from "../../../utils/utils";
import "./Agreement.scss";
import { useCallback } from "react";

const agreement = (p) => {
  if (!isDefined(p)) return "zero";
  if (p < 33) return "low";
  if (p < 66) return "medium";
  return "high";
};

const formatNumber = (num) => {
  const number = Number(num);

  if (num % 1 === 0) {
    return number;
  }
  return number.toFixed(2);
};

export const Agreement = (cell) => {
  const { value, original: task } = cell;
  const sdk = useSDK();
  const agreementCN = cn("agreement");
  const scoreElem = agreementCN.elem("score");
  const handleClick = useCallback(
    (e) => {
      sdk.invoke("agreementCellClick", e, task);
    },
    [sdk, task],
  );

  return (
    <div className={agreementCN.toString()} onClick={handleClick}>
      <span className={clsx(scoreElem.toString(), scoreElem.mod({ [agreement(value)]: true }).toString())}>
        {isDefined(value) ? `${formatNumber(value)}%` : ""}
      </span>
    </div>
  );
};

Agreement.userSelectable = false;
