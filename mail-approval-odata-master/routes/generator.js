const express = require('express');
const router = express.Router();
const { validateRequest } = require("../models/request");
const jwt = require("jsonwebtoken");
const _ = require("lodash");


const generateToken = function (oReq) {
    let oConvReq = _.cloneDeep(oReq);
    let oData = {
        uname: oConvReq.uname,
        actio: null
    };
    if (oConvReq.hasOwnProperty("mapid")) {
        oData.mapid = oConvReq.mapid;
    } else if (oConvReq.hasOwnProperty("docid")) {
        oData.docid = oConvReq.docid;
        oData.appno = oConvReq.appno;
    }


    //Approve token 
    oData.actio = "APPROVE";
    oConvReq.aptkn = jwt.sign(oData, process.env.JWT_PRIVATE_KEY);

    //Reject token 
    oData.actio = "REJECT";
    oConvReq.rjtkn = jwt.sign(oData, process.env.JWT_PRIVATE_KEY);

    //Revise token 
    oData.actio = "REVISE";
    oConvReq.rvtkn = jwt.sign(oData, process.env.JWT_PRIVATE_KEY);

    return oConvReq;
};

router.get("/", async (req, res) => {

    return res.status(405).send("Method not allowed");

});

router.post("/", async (req, res) => {
    const { error } = validateRequest(req.body);
    //console.log( req.body );

    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    try {
        let oResponse = null;
        if (req.body.hasOwnProperty("docid")) {
            oResponse = generateToken(req.body);
        } else {
            oResponse = [];
            req.body.forEach(function (oReqLine) {
                let oToken = generateToken(oReqLine);
                oResponse.push(oToken);
            });
        }

        res.setHeader('Content-Type', 'application/json');
        res.status(200).end(JSON.stringify(oResponse));

    } catch (oEx) {
        return res.status(400).send(oEx);
    }


});


module.exports = router;