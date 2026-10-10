import assert from "node:assert/strict";
import { test } from "node:test";
import { calculate, calculationSchema } from "../shared/moneyLab.js";
test("Money Lab arithmetic and undefined financial ratios", () => {
  assert.deepEqual(
    calculate("profit", { price: 100, cost: 40, units: 100, fixed: 2000 }).map(
      (x) => x.value,
    ),
    [10000, 4000, 40],
  );
  assert.equal(
    calculate("profit", { price: 0, cost: 0, units: 0, fixed: 0 })[2].value,
    null,
  );
  assert.equal(calculate("pricing", { cost: 60, margin: 40 })[0].value, 100);
  assert.equal(
    calculate("break-even", { price: 100, cost: 40, fixed: 2000 })[1].value,
    34,
  );
  assert.equal(
    calculate("break-even", { price: 40, cost: 40, fixed: 2000 })[1].value,
    null,
  );
  assert.equal(
    calculate("runway", { cash: 9000, inflow: 1000, outflow: 4000 })[1].value,
    3,
  );
  assert.equal(
    calculate("runway", { cash: 0, inflow: 100, outflow: 100 })[1].value,
    null,
  );
  assert.equal(
    calculate("loan", { principal: 12000, rate: 0, months: 12 })[0].value,
    1000,
  );
  assert.ok(
    Math.abs(
      calculate("loan", { principal: 100000, rate: 12, months: 12 })[0].value -
        8884.8789,
    ) < 0.001,
  );
  assert.equal(
    calculate("roi", { investment: 10000, returned: 8000 })[1].value,
    -20,
  );
  const valid = {
    title: "Test",
    kind: "pricing",
    currency: "PHP",
    inputs: { cost: 60, margin: 40 },
  };
  assert.ok(calculationSchema.safeParse(valid).success);
  assert.ok(
    !calculationSchema.safeParse({
      ...valid,
      inputs: { cost: 60, margin: 100 },
    }).success,
  );
  assert.ok(
    !calculationSchema.safeParse({ ...valid, inputs: { cost: 60 } }).success,
  );
  assert.ok(
    !calculationSchema.safeParse({ ...valid, inputs: { cost: -1, margin: 20 } })
      .success,
  );
});
