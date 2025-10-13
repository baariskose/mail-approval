const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const axios = require('axios');
const xml2js = require('xml2js');
const { replace } = require('lodash');

router.get('/', async (req, res) => {
    return res.status(405).send('GET not allowed');
});

router.get('/:processToken', async (req, res) => {
    let sToken = req.params.processToken;
    const parser = new xml2js.Parser();
    if (!sToken) {
        //return res.status(400).send('Invalid token');
        res.status(400).send("Geçersiz işlem numarası");
    }

    console.log("Token:" + sToken);

    jwt.verify(sToken, process.env.JWT_PRIVATE_KEY, function (err, decoded) {
        if (err) {
            return res.status(400).send("Geçersiz işlem numarası");
        } else {
            let sServiceUrl = process.env.SAP_BASE_URL + process.env.SAP_SERVICE_URL;
            if (decoded.sysid === "KED" || decoded.sysid === "KEQ") {
                //sServiceUrl= process.env.SAP_BASE_URL + process.env.SAP_SERVICE_URL;
                sServiceUrl = process.env.SAP_SERVICE_2;
            }
            else if (decoded.sysid == "KEP") {
                sServiceUrl = process.env.SAP_BASE_URL_PRD + process.env.SAP_SERVICE_URL;
            }


            console.log("Service URL:" + sServiceUrl);
            console.log("Token decode edildi")
            const CONNECTION = {
                url: sServiceUrl,
                user: process.env.SAP_USERNAME,
                password: process.env.SAP_PASSWORD
            };

            console.log("Process auth:" + process.env.SAP_USERNAME + "@" + process.env.SAP_PASSWORD);
            console.log("Decoded token:", JSON.stringify(decoded));
            // let xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
            //       xmlns:urn="urn:sap-com:document:sap:rfc:functions">
            //     <soapenv:Header/>
            //         <soapenv:Body>
            //             <urn:Z_WF_MOBILE_APP_MANAGE>
            //                 <IV_ACTIO>${decoded.actio}</IV_ACTIO>
            //                 <IV_APPNO>${decoded.appno}</IV_APPNO>
            //                 <IV_DOCID>${decoded.docid}</IV_DOCID>
            //                 <IV_PRCID>${decoded.prcid}</IV_PRCID>
            //                 <IV_SYSID>${decoded.sysid}</IV_SYSID>
            //                 <IV_UNAME>${decoded.uname}</IV_UNAME>
            //                 <IV_APPNO2>${decoded.appno2}</IV_APPNO2>
            //             </urn:Z_WF_MOBILE_APP_MANAGE>
            //         </soapenv:Body>
            //     </soapenv:Envelope>`

            const token = Buffer.from(`${CONNECTION.user}:${CONNECTION.password}`).toString('base64');
            let config = {
                //method: 'get',
                method: 'post',
                maxBodyLength: Infinity,
                url: sServiceUrl,
                headers: {
                    //'Content-Type': 'text/xml',
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${token}`,
                    //'Host': 'onay.kizilayteknoloji.com.tr',
                    //'Cookie': 'sap-usercontext=sap-client=500'
                },
                data: JSON.stringify({
                    IV_ACTIO: decoded.actio,
                    IV_APPNO: decoded.appno,
                    IV_DOCID: decoded.docid,
                    IV_PRCID: decoded.prcid,
                    IV_SYSID: decoded.sysid,
                    IV_UNAME: decoded.uname,
                    IV_APPNO2: decoded.appno2
                })

            };

            axios.request(config)
                .then((response) => {
                    console.log("SAPDEN istek başarılı döndü")
                    console.log(JSON.stringify(response.data));
                    const item = response.data.ET_RETURN2?.item;
                    // parser.parseString(response.data, (err, result) => {
                    //     if (err) {
                    //         console.error("Hata:", err);
                    //     } else {
                    //         // const envelope = result['soap-env:Envelope'];
                    //         // const body = envelope['soap-env:Body'];
                    //         // const data = body[0];
                    //         // const data2 = data['n0:Z_WF_MOBILE_APP_MANAGEResponse'];
                    //         // const data3 = data2[0];
                    //         // const data4 = data3["ET_RETURN2"];
                    //         // responseLast = data4[0].item[0];
                    //         responseLast = response.data;
                    //         console.log("JSON:", responseLast);

                    //     }
                    // });
                    if (!item) {
                        console.error("ET_RETURN2 veya item bulunamadı");
                        return res.status(400).send({
                            success: false,
                            message: "Yanıt formatı hatalı"
                        });
                    }

                    console.log("Response Item:", item);

                    // Frontend'e JSON olarak gönder
                    return res.status(200).send(item);
                    return res.status(200).send(responseLast);//.send(oApproval.Actio === "APPROVE" ?
                    //                        "Talep başarıyla onaylandı" :
                    //                        "Talep başarıyla reddedildi");

                })
                .catch((error) => {
                    console.log("SAP Den cevap hatalı geldi")
                    console.log("Error:", error);
                    return res.status(400).send("<div style='color: #721c24; background-color: #f8d7da; position: relative; padding: .75rem 1.25rem; border: 1px solid #f5c6cb; border-radius: .25rem;'>Onay aşamasında bağlantı başarısız!</div>");
                });


            // require("node-ui5").then(({ sap }) => {
            //     sap.ui.require([
            //         'sap/ui/model/odata/v2/ODataModel',
            //         'node-ui5/authenticate/basic-with-csrf',
            //         'node-ui5/promisify',
            //     ], async function (ODataModel, authenticate) {
            //         let sError = false;

            //         let oConn = await authenticate(CONNECTION).catch(() => {
            //             sError = true;
            //             return res.status(400).send("<div style='color: #721c24; background-color: #f8d7da; position: relative; padding: .75rem 1.25rem; border: 1px solid #f5c6cb; border-radius: .25rem;'>Onay sistemine bağlantı başarısız!</div>");
            //         });

            //         if (oConn && !sError) {
            //             const oModel = new ODataModel(oConn);

            //             await oModel.metadataLoaded();

            //             let sPath, oApproval;

            //             if (decoded.hasOwnProperty("docid")) {
            //                 sPath = oModel.createKey("/ProcessApprovalSet", {
            //                     "Docid": decoded.docid,
            //                     "Appno": decoded.appno,
            //                     "Uname": decoded.uname
            //                 });

            //                 oApproval = {
            //                     "Docid": decoded.docid,
            //                     "Appno": decoded.appno,
            //                     "Uname": decoded.uname,
            //                     "Actio": decoded.actio,
            //                     "Stpnt": ""
            //                 };
            //             } else if (decoded.hasOwnProperty("mapid")) {
            //                 sPath = oModel.createKey("/ProcessMassApprovalSet", {
            //                     "Mapid": decoded.mapid,
            //                     "Uname": decoded.uname
            //                 });

            //                 oApproval = {
            //                     "Mapid": decoded.mapid,
            //                     "Uname": decoded.uname,
            //                     "Actio": decoded.actio,
            //                     "Stpnt": ""
            //                 };
            //             }

            //             oModel.update(sPath, oApproval, {
            //                 success: function (oData, oResponse) {
            //                     try {
            //                         let oHeader = JSON.parse(oResponse.headers["sap-process-return"]);
            //                         oHeader.Message = decodeURI(oHeader.Message);
            //                         if (oHeader.Type === "E") {
            //                             return res.status(400).send(oApproval.Actio === "APPROVE" ?
            //                                 "Onay işlemi sırasında hata oluştu:<br>" + oHeader.Message :
            //                                 "Reddetme işlemi sırasında hata oluştu:<br>" + oHeader.Message)
            //                         } else {

            //                             return res.status(200).send(oApproval.Actio === "APPROVE" ?
            //                                 "Talep başarıyla onaylandı" :
            //                                 "Talep başarıyla reddedildi");
            //                         }

            //                     } catch (oEx) {
            //                         return res.status(400).send(oApproval.Actio === "APPROVE" ?
            //                             "Onay işlemi sırasında beklenmeyen hata oluştu" :
            //                             "Reddetme işlemi sırasında beklenmeyen hata oluştu"
            //                         );

            //                     }
            //                 },
            //                 error: function (oError) {
            //                     return res.status(400).send("Onay/ret sırasında hata oluştu:<br> " + oError.responseText);

            //                 }
            //             });
            //         } else {
            //             return res.status(400).send("<div style='color: #721c24; background-color: #f8d7da; position: relative; padding: .75rem 1.25rem; border: 1px solid #f5c6cb; border-radius: .25rem;'>Onay sistemine bağlantı başarısız!</div>");
            //         }

            //     })
            // });

        }
    });

});


module.exports = router;