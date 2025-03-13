use serde::{Deserialize, Serialize};
use sqlx::{migrate::MigrateDatabase, sqlite::SqlitePoolOptions, FromRow, Pool, Sqlite};
use tauri::{App, Manager};
// use futures::TryStreamExt;

type Db = Pool<Sqlite>;

struct AppState {
    db: Db,
}

async fn setup_db(app: &App) -> Db {
    let mut path = app.path().app_data_dir().expect("failed to get data_dir");
    println!("{:?}", path);
    match std::fs::create_dir_all(path.clone()) {
        Ok(_) => {}
        Err(err) => {
            panic!("error creating directory {}", err);
        }
    };

    path.push("db.sqlite");

    Sqlite::create_database(
        format!(
            "sqlite:{}",
            path.to_str().expect("path should be something")
        )
        .as_str(),
    )
    .await
    .expect("failed to create database");

    let db = SqlitePoolOptions::new()
        .connect(path.to_str().unwrap())
        .await
        .unwrap();

    sqlx::migrate!("./migrations").run(&db).await.unwrap();

    db
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            add_product_order,
            get_product_orders,
            update_product_order,
            delete_product_order,
            add_project,
            get_projects,
            update_project,
            delete_project,
            add_product_order_to_project,
            remove_product_order_from_project
        ])
        .setup(|app| {
            tauri::async_runtime::block_on(async move {
                let db = setup_db(&app).await;

                app.manage(AppState { db });
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error building the app");
}

// --- Product Order ---

#[derive(Debug, Serialize, Deserialize, FromRow)]
struct ProductOrder {
    id: u32,
    order_number: u32,
    purchaser: String,
    item: String, // change later to thing
    quantity: u32,
    date_of_order: String,
}

#[tauri::command]
async fn add_product_order(
    state: tauri::State<'_, AppState>,
    order_number: u32,
    purchaser: String,
    item: String, // change later to thing
    quantity: u32,
    date_of_order: String, // or NaiveDate
) -> Result<(), String> {
    let db = &state.db;

    println!(
        "{} {} {} {} {}",
        order_number, purchaser, item, quantity, date_of_order
    );

    sqlx::query("INSERT INTO product_orders (order_number, purchaser, item, quantity, date_of_order) VALUES (?1, ?2, ?3, ?4, ?5)")
        .bind(order_number)
        .bind(purchaser)
        .bind(item) // change later to thing
        .bind(quantity)
        .bind(date_of_order)
        .execute(db)
        .await
        .map_err(|e| format!("Error saving product order: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn get_product_orders(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<ProductOrder>, String> {
    let db = &state.db;

    let product_orders: Vec<ProductOrder> =
        sqlx::query_as::<_, ProductOrder>("SELECT * FROM product_orders")
            // .fetch(db)
            // .try_collect()
            .fetch_all(db)
            .await
            .map_err(|e| format!("Failed to get product orders {}", e))?;

    Ok(product_orders)
}

#[tauri::command]
async fn update_product_order(
    state: tauri::State<'_, AppState>,
    product_order: ProductOrder,
) -> Result<(), String> {
    let db = &state.db;

    sqlx::query("UPDATE product_orders SET order_number = ?1, purchaser = ?2, item = ?3, quantity = ?4, date_of_order = ?5 WHERE id = ?6")
        .bind(product_order.order_number)
        .bind(product_order.purchaser)
        .bind(product_order.item) // change later to thing
        .bind(product_order.quantity)
        .bind(product_order.date_of_order)
        .bind(product_order.id)
        .execute(db)
        .await
        .map_err(|e| format!("could not update product order {}", e))?;

    Ok(())
}

#[tauri::command]
async fn delete_product_order(state: tauri::State<'_, AppState>, id: u32) -> Result<(), String> {
    let db = &state.db;

    sqlx::query("DELETE FROM product_orders WHERE id = ?1")
        .bind(id)
        .execute(db)
        .await
        .map_err(|e| format!("could not delete product order {}", e))?;

    Ok(())
}

// --- Project ---

#[derive(Debug, Serialize, Deserialize, FromRow)]
struct Project {
    id: u32,
    project_number: u32,
}

#[tauri::command]
async fn add_project(state: tauri::State<'_, AppState>, project_number: u32) -> Result<(), String> {
    let db = &state.db;

    println!("{}", project_number);

    sqlx::query("INSERT INTO projects (project_number) VALUES (?1)")
        .bind(project_number)
        .execute(db)
        .await
        .map_err(|e| format!("Error saving project: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn get_projects(state: tauri::State<'_, AppState>) -> Result<Vec<Project>, String> {
    let db = &state.db;

    let projects: Vec<Project> = sqlx::query_as::<_, Project>("SELECT * FROM projects")
        .fetch_all(db)
        .await
        .map_err(|e| format!("Failed to get projects {}", e))?;

    Ok(projects)
}

#[tauri::command]
async fn update_project(state: tauri::State<'_, AppState>, project: Project) -> Result<(), String> {
    let db = &state.db;

    sqlx::query("UPDATE projects SET project_number = ?1 WHERE id = ?2")
        .bind(project.project_number)
        .bind(project.id)
        .execute(db)
        .await
        .map_err(|e| format!("could not update project {}", e))?;

    Ok(())
}

#[tauri::command]
async fn delete_project(state: tauri::State<'_, AppState>, id: u32) -> Result<(), String> {
    let db = &state.db;

    sqlx::query("DELETE FROM projects WHERE id = ?1")
        .bind(id)
        .execute(db)
        .await
        .map_err(|e| format!("could not delete project {}", e))?;

    Ok(())
}

#[tauri::command]
async fn add_product_order_to_project(
    state: tauri::State<'_, AppState>,
    project_id: u32,
    product_order_id: u32,
) -> Result<(), String> {
    let db = &state.db;

    sqlx::query("INSERT INTO product_order_project_links (project, product_order) VALUES (?1, ?2)")
        .bind(project_id)
        .bind(product_order_id)
        .execute(db)
        .await
        .map_err(|e| format!("Error saving product order-project link: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn remove_product_order_from_project(
    state: tauri::State<'_, AppState>,
    id: u32,
) -> Result<(), String> {
    let db = &state.db;

    sqlx::query("DELETE FROM product_order_project_links WHERE id = ?1")
        .bind(id)
        .execute(db)
        .await
        .map_err(|e| format!("Error removing product order-project link: {}", e))?;

    Ok(())
}
