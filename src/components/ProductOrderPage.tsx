import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

interface ProductOrder {
  id: number;
  orderNumber: number;
  purchaser: string;
  item: string;
  quantity: number;
  dateOfOrder: string;
}

const addProductOrder = async (
  orderNumber: number,
  purchaser: string,
  item: string,
  quantity: number,
  dateOfOrder: string
) => {
  return await invoke("add_product_order", {
    orderNumber: Number(orderNumber),
    purchaser: purchaser,
    item: item,
    quantity: Number(quantity),
    dateOfOrder: dateOfOrder,
  });
};

const getProductOrders = async (): Promise<ProductOrder[]> => {
  return await invoke("get_product_orders");
};

const updateProductOrder = async (
  id: number,
  orderNumber: number,
  purchaser: String,
  item: String,
  quantity: number,
  dateOfOrder: String
) => {
  return await invoke("update_product_order", {
    productOrder: {
      id: Number(id),
      order_number: Number(orderNumber),
      purchaser,
      item,
      quantity: Number(quantity),
      date_of_order: dateOfOrder,
    },
  });
};

const deleteProductOrder = async (id: number) => {
  return await invoke("delete_product_order", { id });
};

// ---

const ProductOrderForm = ({ fetchProductOrders }) => {
  const [form, setForm] = useState({
    orderNumber: 0,
    purchaser: "",
    item: "",
    quantity: 1,
    dateOfOrder: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.name === "orderNumber" || e.target.name === "quantity"
          ? Number(e.target.value)
          : e.target.value,
    });
  };

  const validateForm = () => {
    if (form.orderNumber <= 0) return "Invalid order number";
    if (!form.purchaser.trim()) return "Purchaser is required.";
    if (!form.item.trim()) return "Item is required.";
    if (form.quantity <= 0) return "Quantity must be at least 1";
    if (!form.dateOfOrder) return "Date of order is required.";
    return "";
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    await addProductOrder(
      form.orderNumber,
      form.purchaser.trim(),
      form.item.trim(),
      form.quantity,
      form.dateOfOrder
    );
    await fetchProductOrders();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="orderNumber"
        type="number"
        value={form.orderNumber}
        onChange={handleChange}
        placeholder="Order Number"
        min="0"
      />
      <input
        name="purchaser"
        type="text"
        value={form.purchaser}
        onChange={handleChange}
        placeholder="Purchaser"
      />
      <input
        name="item"
        type="text"
        value={form.item}
        onChange={handleChange}
        placeholder="Item"
      />
      <input
        name="quantity"
        type="number"
        value={form.quantity}
        onChange={handleChange}
        min="1"
      />
      <input
        name="dateOfOrder"
        type="date"
        value={form.dateOfOrder}
        onChange={handleChange}
      />
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button type="submit">Submit</button>
    </form>
  );
};

const ProductOrdersLog = ({ productOrders, fetchProductOrders }) => {
  const [selectedOrder, setSelectedOrder] = useState({
    id: 0,
    order_number: 0,
    purchaser: "",
    item: "",
    quantity: 1,
    date_of_order: "",
  });
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    await deleteProductOrder(id);
    fetchProductOrders();
  };

  const handleUpdate = async () => {
    await updateProductOrder(
      selectedOrder.id,
      selectedOrder.order_number,
      selectedOrder.purchaser,
      selectedOrder.item,
      selectedOrder.quantity,
      selectedOrder.date_of_order
    );
    fetchProductOrders();
    handleClose();
  };

  const handleChange = (e) => {
    setSelectedOrder({ ...selectedOrder, [e.target.name]: e.target.value });
  };

  const columns = [
    {
      field: "order_number",
      headerName: "Order #",
      // type: "number",
      flex: 1,
    },
    { field: "purchaser", headerName: "Purchaser", flex: 1 },
    { field: "item", headerName: "Item", flex: 1 },
    {
      field: "quantity",
      headerName: "Quantity",
      type: "number",
      flex: 1,
    },
    {
      field: "date_of_order",
      headerName: "Date Of Order",
      flex: 1,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <IconButton size="small" onClick={() => handleEdit(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  const paginationModel = { page: 0, pageSize: 20 };

  return (
    <div>
      <p>Product Orders</p>
      <Paper sx={{ height: 400, width: "90%", margin: "auto" }}>
        <DataGrid
          rows={productOrders}
          columns={columns}
          initialState={{ pagination: { paginationModel } }}
          pageSizeOptions={[20, 50, 100]}
          density="compact"
          sx={{ border: 0 }}
          disableColumnFilter
          disableColumnSelector
          disableDensitySelector
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
            },
          }}
        />
      </Paper>
      <Dialog open={open}>
        <DialogTitle>Edit Product Order</DialogTitle>
        <DialogContent>
          <TextField
            label="Order #"
            name="order_number"
            value={selectedOrder.order_number}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Purchaser"
            name="purchaser"
            value={selectedOrder.purchaser}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Item"
            name="item"
            value={selectedOrder.item}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Quantity"
            name="quantity"
            type="number"
            value={selectedOrder.quantity}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Date of Order"
            name="date_of_order"
            type="date"
            value={selectedOrder.date_of_order}
            onChange={handleChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleUpdate} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const ProductOrderPage = () => {
  const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProductOrders = async () => {
    try {
      const orders = await getProductOrders();
      setProductOrders(orders);
      console.log(orders);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching product orders:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductOrders();
  }, []);

  return (
    <div>
      <h1>Product Order Page</h1>
      <ProductOrderForm fetchProductOrders={fetchProductOrders} />

      {loading ? (
        <p>Loading product orders...</p>
      ) : (
        <ProductOrdersLog
          productOrders={productOrders}
          fetchProductOrders={fetchProductOrders}
        />
      )}
    </div>
  );
};

export default ProductOrderPage;
