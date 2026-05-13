const express = require("express");
const router = express.Router();
const controller = require("../controllers/mapController");
const requireAuth = require("../middleware/auth");

router.get("/", controller.getAllPublic);
router.get("/mine", requireAuth, controller.getMyMaps);
router.post("/", requireAuth, controller.createMap);
router.put("/:id", requireAuth, controller.updateMap);
router.post("/:id/complete", requireAuth, controller.completeMap);
router.post("/:id/publish", requireAuth, controller.publishMap);
router.get("/:id", controller.getMapById);

module.exports = router;
