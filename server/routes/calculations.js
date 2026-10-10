import mongoose from "mongoose";
import { Calculation } from "../models/calculation.js";
import { calculationSchema, calculate } from "../../shared/moneyLab.js";
export function registerCalculations(router) {
  const serialize = (doc) => {
    const v = doc.toObject({ flattenMaps: true });
    return { ...v, results: calculate(v.kind, v.inputs) };
  };
  router.get("/calculations", async (req, res) =>
    res.json(
      (
        await Calculation.find({ owner: req.user.id })
          .sort({ updatedAt: -1 })
          .limit(200)
      ).map(serialize),
    ),
  );
  router.post("/calculations", async (req, res) => {
    const data = calculationSchema.parse(req.body);
    if ((await Calculation.countDocuments({ owner: req.user.id })) >= 200)
      return res
        .status(400)
        .json({
          error:
            "You can save up to 200 calculations. Remove one to make room.",
        });
    res
      .status(201)
      .json(
        serialize(await Calculation.create({ ...data, owner: req.user.id })),
      );
  });
  router.put("/calculations/:calculationId", async (req, res) => {
    const data = calculationSchema.parse(req.body);
    const doc = mongoose.isValidObjectId(req.params.calculationId)
      ? await Calculation.findOneAndUpdate(
          { _id: req.params.calculationId, owner: req.user.id },
          { $set: data },
          { returnDocument: "after", runValidators: true },
        )
      : null;
    return doc
      ? res.json(serialize(doc))
      : res.status(404).json({ error: "Calculation not found." });
  });
  router.delete("/calculations/:calculationId", async (req, res) => {
    const doc = mongoose.isValidObjectId(req.params.calculationId)
      ? await Calculation.findOneAndDelete({
          _id: req.params.calculationId,
          owner: req.user.id,
        })
      : null;
    return doc
      ? res.json({ ok: true })
      : res.status(404).json({ error: "Calculation not found." });
  });
}
