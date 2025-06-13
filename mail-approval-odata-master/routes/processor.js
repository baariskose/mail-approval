const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");

router.get('/', async (req, res) => {
    return res.status(405).send('GET not allowed');
});

router.get('/:processToken', async (req, res) => {
    let sToken = req.params.processToken;

    if (!sToken) {
        //return res.status(400).send('Invalid token');
        res.status(400).send("Geçersiz işlem numarası");
    }

    jwt.verify(sToken, process.env.JWT_PRIVATE_KEY, function (err, decoded) {
        if (err) {
            return res.status(400).send("Geçersiz işlem numarası");
        } else {
            let sServiceUrl = process.env.SAP_BASE_URL + process.env.SAP_SERVICE_URL;

            const CONNECTION = {
                url: sServiceUrl,
                user: process.env.SAP_USERNAME,
                password: process.env.SAP_PASSWORD
            };

            require("node-ui5").then(({ sap }) => {
                sap.ui.require([
                    'sap/ui/model/odata/v2/ODataModel',
                    'node-ui5/authenticate/basic-with-csrf',
                    'node-ui5/promisify',
                ], async function (ODataModel, authenticate) {
                    let sError = false;

                    let oConn = await authenticate(CONNECTION).catch(() => {
                        sError = true;
                        return res.status(400).send("<div style='color: #721c24; background-color: #f8d7da; position: relative; padding: .75rem 1.25rem; border: 1px solid #f5c6cb; border-radius: .25rem;'>Onay sistemine bağlantı başarısız!</div>");
                    });

                    if (oConn && !sError) {
                        const oModel = new ODataModel(oConn);

                        await oModel.metadataLoaded();

                        let sPath, oApproval;

                        if (decoded.hasOwnProperty("docid")) {
                            sPath = oModel.createKey("/ProcessApprovalSet", {
                                "Docid": decoded.docid,
                                "Appno": decoded.appno,
                                "Uname": decoded.uname
                            });

                            oApproval = {
                                "Docid": decoded.docid,
                                "Appno": decoded.appno,
                                "Uname": decoded.uname,
                                "Actio": decoded.actio,
                                "Stpnt": ""
                            };
                        } else if (decoded.hasOwnProperty("mapid")) {
                            sPath = oModel.createKey("/ProcessMassApprovalSet", {
                                "Mapid": decoded.mapid,
                                "Uname": decoded.uname
                            });

                            oApproval = {
                                "Mapid": decoded.mapid,
                                "Uname": decoded.uname,
                                "Actio": decoded.actio,
                                "Stpnt": ""
                            };
                        }

                        oModel.update(sPath, oApproval, {
                            success: function (oData, oResponse) {
                                try {
                                    let oHeader = JSON.parse(oResponse.headers["sap-process-return"]);
                                    oHeader.Message = decodeURI(oHeader.Message);
                                    if (oHeader.Type === "E") {
                                        return res.status(400).send(oApproval.Actio === "APPROVE" ?
                                            "Onay işlemi sırasında hata oluştu:<br>" + oHeader.Message :
                                            "Reddetme işlemi sırasında hata oluştu:<br>" + oHeader.Message)
                                    } else {

                                        return res.status(200).send(oApproval.Actio === "APPROVE" ?
                                            "Talep başarıyla onaylandı" :
                                            "Talep başarıyla reddedildi");
                                    }

                                } catch (oEx) {
                                    return res.status(400).send(oApproval.Actio === "APPROVE" ?
                                        "Onay işlemi sırasında beklenmeyen hata oluştu" :
                                        "Reddetme işlemi sırasında beklenmeyen hata oluştu"
                                    );

                                }
                            },
                            error: function (oError) {
                                return res.status(400).send("Onay/ret sırasında hata oluştu:<br> " + oError.responseText);

                            }
                        });
                    } else {
                        return res.status(400).send("<div style='color: #721c24; background-color: #f8d7da; position: relative; padding: .75rem 1.25rem; border: 1px solid #f5c6cb; border-radius: .25rem;'>Onay sistemine bağlantı başarısız!</div>");
                    }

                })
            });
        }
    });

});


module.exports = router;