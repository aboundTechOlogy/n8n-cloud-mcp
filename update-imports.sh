#!/bin/bash
# Add TEMPLATE imports
echo "Adding TEMPLATE tool imports..."
sed -i '33i import templatesearch from '"'"'./tools/template_search'"'"';' src/index.ts
sed -i '34i import templateget from '"'"'./tools/template_get'"'"';' src/index.ts
sed -i '35i import templatelist from '"'"'./tools/template_list'"'"';' src/index.ts
sed -i '36i import templateapply from '"'"'./tools/template_apply'"'"';' src/index.ts
sed -i '37i import templatecreate from '"'"'./tools/template_create'"'"';' src/index.ts
sed -i '38i import templateupdate from '"'"'./tools/template_update'"'"';' src/index.ts
sed -i '39i import templatedelete from '"'"'./tools/template_delete'"'"';' src/index.ts

# Add AI imports
echo "Adding AI tool imports..."
sed -i '40i import aisuggestworkflow from '"'"'./tools/ai_suggest_workflow'"'"';' src/index.ts
sed -i '41i import aioptimizeworkflow from '"'"'./tools/ai_optimize_workflow'"'"';' src/index.ts
sed -i '42i import aigeneratedescription from '"'"'./tools/ai_generate_description'"'"';' src/index.ts
sed -i '43i import aidetecterrors from '"'"'./tools/ai_detect_errors'"'"';' src/index.ts
sed -i '44i import aisuggestnodes from '"'"'./tools/ai_suggest_nodes'"'"';' src/index.ts
sed -i '45i import aiexplainworkflow from '"'"'./tools/ai_explain_workflow'"'"';' src/index.ts

# Update tools registry
echo "Updating tools registry..."
sed -i "/  'node.list_categories': nodelistcategories,/a\\
  'template.search': templatesearch,\\
  'template.get': templateget,\\
  'template.list': templatelist,\\
  'template.apply': templateapply,\\
  'template.create': templatecreate,\\
  'template.update': templateupdate,\\
  'template.delete': templatedelete,\\
  'ai.suggest_workflow': aisuggestworkflow,\\
  'ai.optimize_workflow': aioptimizeworkflow,\\
  'ai.generate_description': aigeneratedescription,\\
  'ai.detect_errors': aidetecterrors,\\
  'ai.suggest_nodes': aisuggestnodes,\\
  'ai.explain_workflow': aiexplainworkflow," src/index.ts
