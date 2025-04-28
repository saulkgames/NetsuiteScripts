/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
 define([
    'N/search',
    'N/record'
], function (
    search,
    record
) {
    function afterSubmit(context) {
        try {
            log.audit({ title: 'context.type', details: JSON.stringify(context.type) });
            var newRec = context.newRecord;
            var recId = newRec.id;
            var recType = newRec.type;
            log.audit({ title: 'recId', details: JSON.stringify(recId) });
            log.audit({ title: 'recType', details: JSON.stringify(recType) });
			var uuidRelDoc = '';
			var relTypeRelDoc = '';
			var displayRelDoc = '';
			var respuesta={
                success:false,
                data:[]
            }

            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var arrayIdCreditMemo=[];
                var lineCount = newRec.getLineCount({ sublistId:'recmachcustrecord_mx_rcs_orig_trans' })||0;
                log.audit({title:'lineCount',details:JSON.stringify(lineCount)});
                for (var index = 0; index < lineCount; index++) {
                    
					uuidRelDoc = newRec.getSublistValue({
						sublistId: 'recmachcustrecord_mx_rcs_orig_trans',
						fieldId: 'custrecord_mx_rcs_uuid',
						line: index
					})|| '';
					
					relTypeRelDoc = newRec.getSublistValue({
						sublistId: 'recmachcustrecord_mx_rcs_orig_trans',
						fieldId: 'custrecord_mx_rcs_rel_type',
						line: index
					})|| '';
					
					displayRelDoc = newRec.getSublistValue({
						sublistId: 'recmachcustrecord_mx_rcs_orig_trans',
						fieldId: 'custrecord_mx_rcs_rel_cfdi_display',
						line: index
					})|| '';
					
					respuesta.data.push({
						"relDocUUID":uuidRelDoc,
						"relDocNombre":displayRelDoc,
						"relDocTipoRel":relTypeRelDoc,
					});
                }
                log.audit({title:'respuesta '+index,details:JSON.stringify(respuesta)});
                
				var tranid = record.submitFields({
					id:recId,
					type:recType,
					values: {
						'custbody_drt_tipo_cambio_uuid':JSON.stringify(respuesta.data)
					},
					options: {
						enableSourcing: false,
						ignoreMandatoryFields: true
					}
				});
				log.audit({title:'tranid',details:JSON.stringify(tranid)});
				
            }
        } catch (error) {
            log.error({ title: 'error afterSubmit', details: JSON.stringify(error) });
        }
    }

    return {
        afterSubmit: afterSubmit
    }
});