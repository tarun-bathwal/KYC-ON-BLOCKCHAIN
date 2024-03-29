'use strict';
var mongoose=require('mongoose');
var Users=require('../models/user').Users;
var customerlist=require('../models/customerlistbanks').customerlistbanks;
var bcrypt=require('bcrypt');
var jwt=require('jsonwebtoken');
var Path = require('path');
var axios = require('axios');
var bankDocuments=require('../models/bankdocuments').BankDocuments;
var users=require('../models/user').Users
var encryptor = require('file-encryptor');
var PromiseA = require('bluebird').Promise;
var fs = PromiseA.promisifyAll(require('fs'));
const ipfsAPI = require('ipfs-api');
const ursa=require('ursa');
var crypto = require('crypto'),algorithm = 'aes-256-ctr';
const ipfs = ipfsAPI('ipfs.infura.io', '5001', {protocol: 'https'});
var banklist = require('../models/bank_list_for_customer').Bank_list_for_customer;

exports.putpending= async (req,res)=>{
    let bankid = req.body.bankid;
    let custid = req.body.custid;
    let resu = await customerlist.find({_id:bankid});
    let length=resu.length;
    if(length==0)
    {
        let entry=new customerlist({
            _id:bankid,
            pendingcustomers : custid,
            confirmedcustomers: ''
        });
        entry.save((err,result)=>{
            res.status(200).json({
                message:'new entry created',
                success:true
            });
        });
    }
    else{
        customerlist.findByIdAndUpdate({_id:bankid},{$push:{pendingcustomers:custid}},(err,result)=>{
            res.status(200).json({
                message:'appended',
                success:true
            });
        });
    }
 
}

exports.getpending= async (req,res)=>{

    // let bankid = req.params.bankid;
    console.log(req.userData);
    let bankid = req.userData.userId;
    console.log(bankid);


    customerlist.find({_id:bankid}).then(async data=>{
        console.log(req.userData);
        var array = data[0].pendingcustomers;
        var data = await Users.find({"_id":{"$in":array}});
        console.log(data);
        res.status(200).json({

            data
        });
      
    //     var custarray = new Array();
    //     data.forEach(element => {
    //         custarray.push(element._id);
    //     });
      
    //     var custbanks = await banklist.find({"_id":{"$in":custarray}});
        
    //     // var res = data.map(x => Object.assign(x, custbanks.find(y => y._id == x._id)));
    //     // console.log(res);
    //     // const result = data.map(val => {
    //     //     return Object.assign({}, val, custbanks.filter(v => v._id === val._id));
    //     // });
    //     // console.log(result);
    //     var map=new Object();
    //     let p=0;
    //     custbanks.forEach(element => {
    //         map[element._id]=p++;
    //     });
    //     console.log(map);
    //     var finaldata=new Array();
    //     var obj = new Object();
    //     data.forEach(element => {
    //         obj=element;
    //         obj['banks']=custbanks[map[element._id]].banks[0];
    //         console.log(obj['banks']);
    //         finaldata.push(obj);
    //     });
    //     res.status(200).json({
    //         data,
    //         custbanks, map
    //     });
    // }); 
    })

}

exports.addDocument= async function (req,res) {
   
    var emaill =req.userData.email;
    var bankid =req.userData.userId;
    
    var mykey=Math.random().toString(36).replace('0.', '');
    console.log("nonecnryped version of the key which is used to encrypt document :  "+mykey);
    var pubkey = ursa.createPublicKey(fs.readFileSync('./keys/'+bankid+'/pubkey.pem'));
    var enc = pubkey.encrypt(mykey, 'utf8', 'base64');
    console.log('encrypted version of the same key encrypted using public key of bank :  ', enc, '\n');

            console.log(req.files[0].path);
            encryptor.encryptFile(req.files[0].path, 'encrypted.dat', mykey,async function(err){
                var uploadedfile=fs.readFileSync('encrypted.dat');
                var testbuffer=new Buffer(uploadedfile);
                var filehash =await ipfs.files.add(testbuffer);
                    
                console.log("ipfshash of the document uploaded to IPFS : "+filehash[0].hash);
                var ipfshash = filehash[0].hash;
                var encryptedkey = enc;
                console.log(ipfshash);
                console.log(encryptedkey);

                res.status(200).json({
                    'ipfs' : ipfshash,
                    'encryptedkey' : encryptedkey

                })


           
            });
        
}