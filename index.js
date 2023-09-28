const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const dotenv = require("dotenv").config()
const app = express()
const Stripe = require('stripe')

app.use(cors())
app.use(express.json({ limit: "10mb" }));


const PORT = process.env.PORT || 8085

//mongodb connection
///console.log(process.env.MONGODB_URL)
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("Connect to Databse"))
  .catch((err) => console.log(err));


//schema
const userSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  confirmPassword: String,
  image: String,
});

//model
const userModel = mongoose.model("user", userSchema);

app.get("/",(req,res)=>{
  res.send("server is running")
})

// api sign up
app.post("/signup", async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if the email already exists in the database
    const existingUser = await userModel.findOne({ email: email });

    if (existingUser) {
      res.send({ message: "Email id is already registered", alert: false });
    } else {
      // Create a new user document and save it to the database
      const newUser = new userModel(req.body);
      await newUser.save();
      res.send({ message: "Successfully signed up", alert: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "An error occurred during signup", alert: false });
  }
});

// login api

app.post('/login', async (req, res) => {
  const { email } = req.body;
  try {
    // Find the user by email
    const result = await userModel.findOne({ email: email });
    
    if (result) {
      const dataSend = {
        _id: result._id,
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email,
        image: result.image,
      };
      //console.log(dataSend);
      res.send({
        message: 'Login is successful',
        alert: true,
        data: dataSend,
      });
    } else {
      res.send({
        message: 'Email is not available, please sign up',
        alert: false,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  } 
});


//save product in data 
//api
app.post("/uploadProduct",async(req,res)=>{
  // console.log(req.body)
  const data = await productModel(req.body)
  const datasave = await data.save()
  res.send({message : "Upload successfully"})
})

const schemaProduct = mongoose.Schema({
  name: String,
  category:String,
  image: String,
  price: String,
  description: String,
});
const productModel = mongoose.model("product",schemaProduct)
//
app.get("/product",async(req,res)=>{
  const data = await productModel.find({})
  res.send(JSON.stringify(data))
})
/*****payment getWay */
//console.log(process.env.STRIPE_SECRET_KEY)


const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY)

app.post("/create-checkout-session",async(req,res)=>{

     try{
      const params = {
          submit_type : 'pay',
          mode : "payment",
          payment_method_types : ['card'],
          billing_address_collection : "auto",
          shipping_options : [{shipping_rate : "shr_1NuTvtSDNFNBxU38Tr7ZLHln"}],

          line_items : req.body.map((item)=>{
            return{
              price_data : {
                currency : "inr",
                product_data : {
                  name : item.name,
                  // images : [item.image]
                },
                unit_amount : item.price * 100,
              },
              adjustable_quantity : {
                enabled : true,
                minimum : 1,
              },
              quantity : item.qty
            }
          }),

          success_url : `${process.env.FRONTEND_URL}/success`,
          cancel_url : `${process.env.FRONTEND_URL}/cancel`,

      }

      
      const session = await stripe.checkout.sessions.create(params)
      // console.log(session)
      res.status(200).json(session.id)
     }
     catch (err){
        res.status(err.statusCode || 500).json(err.message)
     }

})


//server is running
app.listen(PORT,()=>console.log("Server is runnning at port : " + PORT))

