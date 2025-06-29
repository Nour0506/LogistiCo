import  Router from 'express';
import Product from '../../models/Product.js';
const router = Router();
// CREATE (POST) - Add a new product
export const createProduct = async (req, res) => {
  try {
    const { name, category,storage_type } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: "Name and category are required!" });
    }

    const newProduct = new Product({ name, category,storage_type });
    await newProduct.save();

    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: "Error creating product", error: error.message });
  }
};

// READ (GET ALL) - Get all available products
export const getAllProducts = async (req, res) => {
  try {
    // Solution 1: Si vous avez un champ 'quantity' dans votre modèle
    // const products = await Product.find({ quantity: { $gt: 0 } });
    
    // Solution 2: Si vous voulez tous les produits (comme avant)
    const products = await Product.find();
    
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error: error.message });
  }
};

// READ (GET BY ID) - Get a single product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product", error: error.message });
  }
};

// UPDATE (PUT/PATCH) - Update a product
export const updateProduct = async (req, res) => {
  try {
    const { name, category,storage_type } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category,storage_type },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Error updating product", error: error.message });
  }
};

// DELETE - Delete a product
export const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error: error.message });
  }
};

// Define Routes
router.post('/add', createProduct);
router.get('/get', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.patch('/:id', updateProduct); 
router.delete('/:id', deleteProduct);

// Export the router
export default router;