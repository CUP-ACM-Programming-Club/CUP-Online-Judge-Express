const express=require('express');
const router=express.Router();
router.get('/',function(req,res,next){
   res.render('index',{title:'CUP Online Judge',header:'API'})
});

module.exports=router;