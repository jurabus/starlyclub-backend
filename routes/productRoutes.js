import express from 'express';
import {
  getProducts,
  getProduct,
  getProductsByProvider,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';


const router = express.Router();


// NEW: must come before '/:id'

router.get('/', getProducts);
router.get('/:id', getProduct);
router.get('/provider/:providerId', getProductsByProvider);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;