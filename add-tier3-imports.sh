#!/bin/bash
echo "Adding all Tier 3 imports (38 tools)..."

# Find the last import line number
LINE=$(grep -n "^import" src/index.ts | tail -1 | cut -d: -f1)
LINE=$((LINE + 1))

# Add all Tier 3 imports
sed -i "${LINE}i\\
import monitoringmetrics from './tools/monitoring_metrics';\\
import monitoringalerts from './tools/monitoring_alerts';\\
import monitoringhealth from './tools/monitoring_health';\\
import monitoringlogs from './tools/monitoring_logs';\\
import monitoringevents from './tools/monitoring_events';\\
import monitoringdashboard from './tools/monitoring_dashboard';\\
import importworkflow from './tools/import_workflow';\\
import exportworkflow from './tools/export_workflow';\\
import importtemplate from './tools/import_template';\\
import exporttemplate from './tools/export_template';\\
import importcredentials from './tools/import_credentials';\\
import exportcredentials from './tools/export_credentials';\\
import organizationfolders from './tools/organization_folders';\\
import organizationtags from './tools/organization_tags';\\
import organizationusers from './tools/organization_users';\\
import organizationpermissions from './tools/organization_permissions';\\
import organizationsettings from './tools/organization_settings';\\
import organizationaudit from './tools/organization_audit';\\
import organizationbackup from './tools/organization_backup';\\
import environmentvariables from './tools/environment_variables';\\
import environmentconfig from './tools/environment_config';\\
import environmentsecrets from './tools/environment_secrets';\\
import environmentconnections from './tools/environment_connections';\\
import environmentstatus from './tools/environment_status';\\
import webhookcreate from './tools/webhook_create';\\
import webhooklist from './tools/webhook_list';\\
import webhooktest from './tools/webhook_test';\\
import webhookdelete from './tools/webhook_delete';\\
import webhooklogs from './tools/webhook_logs';\\
import utilityvalidatejson from './tools/utility_validate_json';\\
import utilityconvertformat from './tools/utility_convert_format';\\
import utilitygenerateid from './tools/utility_generate_id';\\
import utilitycalculatehash from './tools/utility_calculate_hash';\\
import utilitybatchprocess from './tools/utility_batch_process';\\
import utilitycleanup from './tools/utility_cleanup';\\
import utilitydebug from './tools/utility_debug';\\
import credentialcreate from './tools/credential_create';\\
import credentialdelete from './tools/credential_delete';" src/index.ts

# Add to registry - find the last entry and add all new ones
sed -i "/  'credential.check_usage': credentialcheckusage,/a\\
  'monitoring.metrics': monitoringmetrics,\\
  'monitoring.alerts': monitoringalerts,\\
  'monitoring.health': monitoringhealth,\\
  'monitoring.logs': monitoringlogs,\\
  'monitoring.events': monitoringevents,\\
  'monitoring.dashboard': monitoringdashboard,\\
  'import.workflow': importworkflow,\\
  'export.workflow': exportworkflow,\\
  'import.template': importtemplate,\\
  'export.template': exporttemplate,\\
  'import.credentials': importcredentials,\\
  'export.credentials': exportcredentials,\\
  'organization.folders': organizationfolders,\\
  'organization.tags': organizationtags,\\
  'organization.users': organizationusers,\\
  'organization.permissions': organizationpermissions,\\
  'organization.settings': organizationsettings,\\
  'organization.audit': organizationaudit,\\
  'organization.backup': organizationbackup,\\
  'environment.variables': environmentvariables,\\
  'environment.config': environmentconfig,\\
  'environment.secrets': environmentsecrets,\\
  'environment.connections': environmentconnections,\\
  'environment.status': environmentstatus,\\
  'webhook.create': webhookcreate,\\
  'webhook.list': webhooklist,\\
  'webhook.test': webhooktest,\\
  'webhook.delete': webhookdelete,\\
  'webhook.logs': webhooklogs,\\
  'utility.validate_json': utilityvalidatejson,\\
  'utility.convert_format': utilityconvertformat,\\
  'utility.generate_id': utilitygenerateid,\\
  'utility.calculate_hash': utilitycalculatehash,\\
  'utility.batch_process': utilitybatchprocess,\\
  'utility.cleanup': utilitycleanup,\\
  'utility.debug': utilitydebug,\\
  'credential.create': credentialcreate,\\
  'credential.delete': credentialdelete," src/index.ts
