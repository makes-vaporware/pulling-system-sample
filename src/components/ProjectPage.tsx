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

const addProject = async (projectNumber: number) => {
  return await invoke("add_project", {
    projectNumber: Number(projectNumber),
  });
};

const getProjects = async () => {
  return await invoke("get_projects");
};

const updateProject = async (id: number, projectNumber: number) => {
  return await invoke("update_project", {
    project: {
      id: Number(id),
      project_number: Number(projectNumber),
    },
  });
};

const deleteProject = async (id: number) => {
  return await invoke("delete_project", { id });
};

// ---

const ProjectForm = ({ fetchProjects }) => {
  const [form, setForm] = useState({
    projectNumber: 0,
  });

  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.name === "projectNumber"
          ? Number(e.target.value)
          : e.target.value,
    });
  };

  const validateForm = () => {
    if (form.projectNumber <= 0) return "Invalid project number";
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
    await addProject(form.projectNumber);
    await fetchProjects();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="projectNumber"
        type="number"
        value={form.projectNumber}
        onChange={handleChange}
        placeholder="Project #"
        min="0"
      />
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button type="submit">Submit</button>
    </form>
  );
};

const ProjectsLog = ({ projects, fetchProjects }) => {
  const [selectedProject, setSelectedProject] = useState({
    id: 0,
    project_number: 0,
  });
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleEdit = (order) => {
    setSelectedProject(order);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    await deleteProject(id);
    fetchProjects();
  };

  const handleUpdate = async () => {
    await updateProject(selectedProject.id, selectedProject.project_number);
    fetchProjects();
    handleClose();
  };

  const handleChange = (e) => {
    setSelectedProject({ ...selectedProject, [e.target.name]: e.target.value });
  };

  const columns = [
    {
      field: "project_number",
      headerName: "Project Number",
      //   type: "number",
      flex: 1,
      align: "left",
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
          rows={projects}
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
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          <TextField
            label="Project #"
            name="project_number"
            value={selectedProject.project_number}
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

const ProjectPage = () => {
  //   const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const projects = await getProjects();
      setProjects(projects);
      console.log(projects);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching product orders:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div>
      <h1>Projects Page</h1>
      <ProjectForm fetchProjects={fetchProjects} />

      {loading ? (
        <p>Loading product orders...</p>
      ) : (
        <ProjectsLog projects={projects} fetchProjects={fetchProjects} />
      )}
    </div>
  );
};

export default ProjectPage;
