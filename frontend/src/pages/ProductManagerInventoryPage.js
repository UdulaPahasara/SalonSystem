import React, { useEffect, useState } from "react";
import { 
  getProductsByManager,     // ✅ FIXED - Added
  getInventoryByProduct 
} from "../api/productApi";
import { createStockRequest } from "../api/stockRequestApi";
import { useAuth } from "../context/AuthContext";

console.log("🚀 ProductManagerInventoryPage MODULE LOADED");

export default function ProductManagerInventoryPage() {
  console.log("🎯 ProductManagerInventoryPage RENDERED - WORKING!");
  
  const { user, userId } = useAuth();

  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [requestQty, setRequestQty] = useState({});
  const [loading, setLoading] = useState(true);

  /* ---------------- LOAD PRODUCTS ---------------- */
  useEffect(() => {
    if (userId) {
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getProductsByManager(userId);  // ✅ FIXED
      setProducts(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- VIEW INVENTORY ---------------- */
  const viewInventory = async (product) => {
    setSelectedProduct(product);
    try {
      const data = await getInventoryByProduct(product.productId);
      setInventory(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load inventory");
    }
  };

  /* ---------------- SEND STOCK REQUEST ---------------- */
  const sendStockRequest = async (branchId) => {
    if (!requestQty[branchId] || requestQty[branchId] <= 0) {
      alert("Enter valid quantity");
      return;
    }

    try {
      await createStockRequest({
        productId: selectedProduct.productId,
        branchId,
        requestedQuantity: parseInt(requestQty[branchId]),
        requestedBy: userId
      });

      alert("Stock request sent!");
      setRequestQty((prev) => ({ ...prev, [branchId]: "" }));
    } catch (err) {
      console.error(err);
      alert("Failed to send stock request");
    }
  };

  /* ---------------- UI ---------------- */
  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Branch Inventory</h2>

      <p>
        <strong>Logged in as:</strong>{" "}
        {user?.fullName || user?.username}
      </p>

      {/* PRODUCTS TABLE */}
      <table border="1" width="100%" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Product</th>
            <th>Brand</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.productId}>
              <td>{p.productId}</td>
              <td>{p.productName}</td>
              <td>{p.brand}</td>
              <td>
                <button onClick={() => viewInventory(p)}>Inventory</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* INVENTORY TABLE */}
      {selectedProduct && (
        <div style={{ marginTop: 30 }}>
          <h3>Inventory – {selectedProduct.productName}</h3>

          <table border="1" width="60%" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Branch</th>
                <th>Quantity</th>
                <th>Request Stock</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((i) => (
                <tr key={i.inventoryId}>
                  <td>{i.branchName}</td>
                  <td>{i.quantity}</td>
                  <td>
                    <input
                      type="number"
                      value={requestQty[i.branchId] || ""}
                      onChange={(e) =>
                        setRequestQty({
                          ...requestQty,
                          [i.branchId]: e.target.value
                        })
                      }
                      style={{ width: 60, marginRight: 10 }}
                    />
                    <button onClick={() => sendStockRequest(i.branchId)}>
                      Request
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
