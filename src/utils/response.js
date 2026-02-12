const success=(res,data,status=200)=>{
    return res.status(status).json({
        success:true,
        data,
        error:null
    });
};

const error=(res,code,status)=>{
    return res.status(status).json({
        success:false,
        data:null,
        error:code
    });
};
    module.exports={
        success,
        error
    };
    
