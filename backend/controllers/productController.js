const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");

// Get all products
const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    }catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Get product by ID
const getProductById = async (req, res) => {
    try{
        const product = await Product.findById(req.params.id);
        if(!product){
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(product);
    }catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Create a new product
const createProduct = async (req, res) => {
    try {
    const { name, description, price, category, stock }=req.body;
    // Either upload a file ("image") or pass a ready-made URL ("imagesUrl")
    let imagesUrl = req.body.imagesUrl || '';
    if(req.file){
        const result=await cloudinary.uploader.upload(req.file.path);
        //console.log(result);
        imagesUrl=result.secure_url;
    }
    const product = new Product({
        name,
        description,
        price,
        category,
        stock,
        imagesUrl
    });
    
        const savedProduct = await product.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

//Update a product
const updateProduct = async (req, res) => {
    try{
        const { name, description, price, category, stock } = req.body;
        const product = await Product.findById(req.params.id);
        if(product){
            // Only update fields that were actually sent (so 0 is allowed for price/stock)
            const has = (v) => v !== undefined && v !== '';
            if(has(name)) product.name = name;
            if(has(description)) product.description = description;
            if(has(price)) product.price = price;
            if(has(category)) product.category = category;
            if(has(stock)) product.stock = stock;
            if(has(req.body.imagesUrl)) product.imagesUrl = req.body.imagesUrl;
            if(req.file){
                const result=await cloudinary.uploader.upload(req.file.path);
                //console.log(result);
                product.imagesUrl=result.secure_url;
            }
            const updatedProduct=await product.save();
            res.json(updatedProduct);
        }else{
            res.status(404).json({message: "product not found"})
        }
    }catch(err){
        console.error(err);
        // Bad id or invalid values (e.g. price "abc") are client errors
        const status = err.name === 'CastError' || err.name === 'ValidationError' ? 400 : 500;
        res.status(status).json({message: status === 400 ? err.message : "Server error"});
    }
}
//delete a product
const deleteProduct = async (req, res) => {
    try{
        const product = await Product.findByIdAndDelete(req.params.id);
        if(!product){
            return res.status(404).json({ message: "Product not found" });
        }
        res.json({ message: "Product deleted successfully" });
    }catch (error) {
        res.status(500).json({ message: error.message });
    }
}
module.exports ={
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
}