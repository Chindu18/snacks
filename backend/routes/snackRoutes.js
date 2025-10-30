import express from "express";
import upload from "../middleware/upload.js";
import {
  getSnacks,
  addSnack,
  updateSnack,
  deleteSnack,
} from "../controllers/snackController.js";

const router = express.Router();

router.get("/", getSnacks);
router.post("/", upload.single("img"), addSnack);
router.put("/:id", upload.single("img"), updateSnack);
router.delete("/:id", deleteSnack);

export default router;
