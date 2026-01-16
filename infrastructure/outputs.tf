# CloudCost Estimator - Terraform Outputs

output "resource_group_name" {
  description = "Name of the resource group"
  value       = data.azurerm_resource_group.main.name
}

output "container_registry_name" {
  description = "Name of the container registry"
  value       = data.azurerm_container_registry.main.name
}

output "container_registry_login_server" {
  description = "Login server URL for the container registry"
  value       = data.azurerm_container_registry.main.login_server
}

output "backend_url" {
  description = "URL of the backend API"
  value       = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
}

output "frontend_url" {
  description = "URL of the frontend application"
  value       = "https://${azurerm_container_app.frontend.ingress[0].fqdn}"
}

output "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace"
  value       = azurerm_log_analytics_workspace.main.id
}

output "container_app_environment_id" {
  description = "ID of the Container App Environment"
  value       = azurerm_container_app_environment.main.id
}