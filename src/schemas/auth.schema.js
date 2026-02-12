const { z }=require('zod');

const signupSchema=z.object({
    name:z.string().min(1),
    email:z.string().email(),
    password:z.string().min(6),
    role:z.enum(['customer','owner']).optional(),
    phone:z.string().optional()

});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
})

module.exports={
    signupSchema ,
    loginSchema
};
