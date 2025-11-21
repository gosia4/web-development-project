"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scanItem_controller_1 = require("../controllers/scanItem.controller");
const router = (0, express_1.Router)();
router.post('/', scanItem_controller_1.createScanItem);
router.get('/', scanItem_controller_1.getScanItems);
exports.default = router;
