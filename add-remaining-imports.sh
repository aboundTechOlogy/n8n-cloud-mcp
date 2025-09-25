#!/bin/bash
echo "Adding remaining Tier 2 imports..."

# Find line number after last import
LINE=$(grep -n "^import" src/index.ts | tail -1 | cut -d: -f1)
LINE=$((LINE + 1))

# Add all imports in one go
sed -i "${LINE}i\\
import analysisperformance from './tools/analysis_performance';\\
import analysisusage from './tools/analysis_usage';\\
import analysiserrors from './tools/analysis_errors';\\
import analysisbottlenecks from './tools/analysis_bottlenecks';\\
import analysisdependencies from './tools/analysis_dependencies';\\
import analysiscost from './tools/analysis_cost';\\
import analysisrecommendations from './tools/analysis_recommendations';\\
import executiondelete from './tools/execution_delete';\\
import executiongetlogs from './tools/execution_get_logs';\\
import executiongetdata from './tools/execution_get_data';\\
import executionstop from './tools/execution_stop';\\
import nodelist from './tools/node_list';\\
import nodegetschema from './tools/node_get_schema';\\
import nodegetdocumentation from './tools/node_get_documentation';\\
import nodevalidate from './tools/node_validate';\\
import nodegetexamples from './tools/node_get_examples';\\
import credentiallist from './tools/credential_list';\\
import credentialgettypes from './tools/credential_get_types';\\
import credentialvalidate from './tools/credential_validate';\\
import credentialtest from './tools/credential_test';\\
import credentialgetschema from './tools/credential_get_schema';\\
import credentialcheckusage from './tools/credential_check_usage';" src/index.ts

# Add to registry
sed -i "/  'ai.explain_workflow': aiexplainworkflow,/a\\
  'analysis.performance': analysisperformance,\\
  'analysis.usage': analysisusage,\\
  'analysis.errors': analysiserrors,\\
  'analysis.bottlenecks': analysisbottlenecks,\\
  'analysis.dependencies': analysisdependencies,\\
  'analysis.cost': analysiscost,\\
  'analysis.recommendations': analysisrecommendations,\\
  'execution.delete': executiondelete,\\
  'execution.get_logs': executiongetlogs,\\
  'execution.get_data': executiongetdata,\\
  'execution.stop': executionstop,\\
  'node.list': nodelist,\\
  'node.get_schema': nodegetschema,\\
  'node.get_documentation': nodegetdocumentation,\\
  'node.validate': nodevalidate,\\
  'node.get_examples': nodegetexamples,\\
  'credential.list': credentiallist,\\
  'credential.get_types': credentialgettypes,\\
  'credential.validate': credentialvalidate,\\
  'credential.test': credentialtest,\\
  'credential.get_schema': credentialgetschema,\\
  'credential.check_usage': credentialcheckusage," src/index.ts
