-- Add migration script here
CREATE TABLE product_orders(
    id INTEGER PRIMARY KEY,
    order_number INTEGER NOT NULL,
    purchaser TEXT NOT NULL,
    item TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    date_of_order DATE NOT NULL
);

CREATE TABLE projects(
    id INTEGER PRIMARY KEY,
    project_number INTEGER NOT NULL
);

CREATE TABLE product_order_project_links(
    id INTEGER PRIMARY KEY,
    project INTEGER NOT NULL REFERENCES projects(id),
    product_order INTEGER NOT NULL REFERENCES product_orders(id)
)