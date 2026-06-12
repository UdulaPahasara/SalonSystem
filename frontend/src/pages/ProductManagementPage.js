import React, { useEffect, useState } from "react";
import {
  getProducts,
  getProductsByManager,
  createProduct,
  updateProduct,
  deleteProduct,
  getInventoryByProduct,
  getInventoryByProductAndManager
} from "../api/productApi";
import { createStockRequest } from "../api/stockRequestApi";
import { useAuth } from "../context/AuthContext";  // Import AuthContext

export default function ProductManagementPage() {
  
  /* -------------------- AUTH CONTEXT -------------------- */
  const { user, userId, userRole } = useAuth();

  /* -------------------- STATE -------------------- */

  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // per-branch requested quantities
  const [requestQty, setRequestQty] = useState({});

  const [form, setForm] = useState({
    product_name: "",
    brand: "",
    unit_price: "",
    low_stock_limit: ""
  });

  /* -------------------- LOAD PRODUCTS -------------------- */

  useEffect(() => {
    if (userId && userRole) {
      loadProducts();
    }
  }, [userId, userRole]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      let data;
      
      // If Product Manager, filter by their assigned branches
      if (userRole === "Product Manager") {
        console.log("Loading products for Product Manager, userId:", userId);
        data = await getProductsByManager(userId);
      } else {
        // Owner/Admin sees all products
        console.log("Loading all products for", userRole);
        data = await getProducts();
      }
      
      setProducts(data);
      console.log("Loaded products:", data.length);
    } catch (error) {
      console.error("Error loading products:", error);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- PRODUCT CRUD -------------------- */

  const submitProduct = async (e) => {
    e.preventDefault();

    const payload = {
      productName: form.product_name,
      brand: form.brand,
      unitPrice: parseFloat(form.unit_price),
      lowStockLimit: parseInt(form.low_stock_limit)
    };

    try {
      if (editingId) {
        await updateProduct(editingId, payload);
        alert("Product updated successfully!");
      } else {
        await createProduct(payload);
        alert("Product created successfully!");
      }

      resetForm();
      loadProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      product_name: "",
      brand: "",
      unit_price: "",
      low_stock_limit: ""
    });
  };

  const editProduct = (p) => {
    setEditingId(p.productId);
    setForm({
      product_name: p.productName,
      brand: p.brand,
      unit_price: p.unitPrice,
      low_stock_limit: p.lowStockLimit
    });
  };

  const removeProduct = async (id) => {
    if (window.confirm("Delete product?")) {
      try {
        await deleteProduct(id);
        alert("Product deleted successfully!");
        loadProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product");
      }
    }
  };

  /* -------------------- INVENTORY -------------------- */

  const viewInventory = async (product) => {
    setSelectedProduct(product);
    
    try {
      let data;
      
      // If Product Manager, filter inventory by their branches
      if (userRole === "Product Manager") {
        console.log("Loading inventory for Product Manager, productId:", product.productId, "userId:", userId);
        data = await getInventoryByProductAndManager(product.productId, userId);
      } else {
        // Owner/Admin sees all branches
        console.log("Loading all inventory for productId:", product.productId);
        data = await getInventoryByProduct(product.productId);
      }
      
      setInventory(data);
      console.log("Loaded inventory:", data.length, "records");
    } catch (error) {
      console.error("Error loading inventory:", error);
      alert("Failed to load inventory");
    }
  };

  /* -------------------- STOCK REQUEST -------------------- */

  const sendStockRequest = async (branchId) => {
    if (!requestQty[branchId] || requestQty[branchId] <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    try {
      await createStockRequest({
        productId: selectedProduct.productId,
        branchId: branchId,
        requestedQuantity: parseInt(requestQty[branchId]),
        requestedBy: userId // Use logged-in user ID from AuthContext
      });

      alert("Stock request sent successfully!");
      setRequestQty(prev => ({ ...prev, [branchId]: "" }));
    } catch (error) {
      console.error("Error sending stock request:", error);
      alert("Failed to send stock request. Please try again.");
    }
  };

  /* -------------------- UI -------------------- */

  if (loading) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Product Management</h2>
      
      {/* Show role indicator */}
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '10px', 
        marginBottom: '20px',
        borderRadius: '5px'
      }}>
        <p style={{ margin: 0 }}>
          <strong>Logged in as:</strong> {user?.fullName || user?.username} 
          <span style={{ marginLeft: '10px', color: '#666' }}>({userRole})</span>
        </p>
        {userRole === "Product Manager" && (
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            📦 Showing products for your assigned branches only
          </p>
        )}
      </div>

      {/* ---------- PRODUCT FORM ---------- */}
      <form onSubmit={submitProduct} style={{ marginBottom: 20 }}>
        <input
          placeholder="Product Name"
          value={form.product_name}
          onChange={e => setForm({ ...form, product_name: e.target.value })}
          required
          style={{ marginRight: 10, padding: 5 }}
        />

        <input
          placeholder="Brand"
          value={form.brand}
          onChange={e => setForm({ ...form, brand: e.target.value })}
          required
          style={{ marginRight: 10, padding: 5 }}
        />

        <input
          type="number"
          step="0.01"
          placeholder="Unit Price"
          value={form.unit_price}
          onChange={e => setForm({ ...form, unit_price: e.target.value })}
          required
          style={{ marginRight: 10, padding: 5 }}
        />

        <input
          type="number"
          placeholder="Low Stock Limit"
          value={form.low_stock_limit}
          onChange={e => setForm({ ...form, low_stock_limit: e.target.value })}
          required
          style={{ marginRight: 10, padding: 5 }}
        />

        <button type="submit" style={{ padding: 5, marginRight: 5 }}>
          {editingId ? "Update" : "Add"} Product
        </button>

        {editingId && (
          <button type="button" onClick={resetForm} style={{ padding: 5 }}>
            Cancel
          </button>
        )}
      </form>

      {/* ---------- PRODUCT TABLE ---------- */}
      <table border="1" width="100%" style={{ marginTop: 20, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ padding: 10 }}>ID</th>
            <th style={{ padding: 10 }}>Name</th>
            <th style={{ padding: 10 }}>Brand</th>
            <th style={{ padding: 10 }}>Price</th>
            <th style={{ padding: 10 }}>Low Stock</th>
            <th style={{ padding: 10 }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: 20, color: '#666' }}>
                {userRole === "Product Manager" 
                  ? "No products found in your assigned branches" 
                  : "No products found"}
              </td>
            </tr>
          ) : (
            products.map(p => (
              <tr key={p.productId}>
                <td style={{ padding: 10 }}>{p.productId}</td>
                <td style={{ padding: 10 }}>{p.productName}</td>
                <td style={{ padding: 10 }}>{p.brand}</td>
                <td style={{ padding: 10 }}>${p.unitPrice}</td>
                <td style={{ padding: 10 }}>{p.lowStockLimit}</td>
                <td style={{ padding: 10 }}>
                  <button 
                    onClick={() => editProduct(p)}
                    style={{ marginRight: 5, padding: '3px 10px' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => removeProduct(p.productId)}
                    style={{ marginRight: 5, padding: '3px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                  <button 
                    onClick={() => viewInventory(p)}
                    style={{ padding: '3px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer' }}
                  >
                    Inventory
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ---------- INVENTORY TABLE ---------- */}
      {selectedProduct && (
        <div style={{ marginTop: 30 }}>
          <h3>Inventory for: {selectedProduct.productName}</h3>
          {userRole === "Product Manager" && (
            <p style={{ color: '#666', fontSize: '14px' }}>
              Showing only branches you manage
            </p>
          )}

          <table border="1" width="60%" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ padding: 10 }}>Branch</th>
                <th style={{ padding: 10 }}>Quantity</th>
                <th style={{ padding: 10 }}>Request Stock</th>
              </tr>
            </thead>

            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: 20, color: '#666' }}>
                    No inventory found
                  </td>
                </tr>
              ) : (
                inventory.map(i => (
                  <tr key={i.inventoryId}>
                    <td style={{ padding: 10 }}>{i.branchName}</td>
                    <td style={{ padding: 10 }}>{i.quantity}</td>
                    <td style={{ padding: 10 }}>
                      <input
                        type="number"
                        min="1"
                        value={requestQty[i.branchId] || ""}
                        onChange={e =>
                          setRequestQty({
                            ...requestQty,
                            [i.branchId]: e.target.value
                          })
                        }
                        placeholder="Qty"
                        style={{ width: 60, marginRight: 10, padding: 5 }}
                      />
                      <button 
                        onClick={() => sendStockRequest(i.branchId)}
                        style={{ padding: '5px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer' }}
                      >
                        Request
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}