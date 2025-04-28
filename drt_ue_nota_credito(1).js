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
    /**
     * Función que se ejecuta después de guardar (create o edit) el registro
     * @param {Object} context - Contexto del User Event
     */
    function afterSubmit(context) {
        try {
            log.audit({ title: 'context.type', details: JSON.stringify(context.type) });
            
            // Obtiene el nuevo registro (después del submit)
            var newRec = context.newRecord;
            var recId = newRec.id;     // ID del registro
            var recType = newRec.type; // Tipo de registro
            log.audit({ title: 'recId', details: JSON.stringify(recId) });
            log.audit({ title: 'recType', details: JSON.stringify(recType) });

            // Variables para almacenar valores de las líneas
            var uuidRelDoc = '';
            var relTypeRelDoc = '';
            var displayRelDoc = '';

            // Estructura para almacenar la respuesta
            var respuesta = {
                success: false,
                data: []
            };

            // Solo ejecuta en creación o edición del registro
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var arrayIdCreditMemo = [];

                // Cuenta la cantidad de líneas en la sublista relacionada
                var lineCount = newRec.getLineCount({ sublistId: 'recmachcustrecord_mx_rcs_orig_trans' }) || 0;
                log.audit({ title: 'lineCount', details: JSON.stringify(lineCount) });

                // Recorre cada línea de la sublista
                for (var index = 0; index < lineCount; index++) {
                    
                    // Obtiene el UUID relacionado de la línea
                    uuidRelDoc = newRec.getSublistValue({
                        sublistId: 'recmachcustrecord_mx_rcs_orig_trans',
                        fieldId: 'custrecord_mx_rcs_uuid',
                        line: index
                    }) || '';
                    
                    // Obtiene el tipo de relación
                    relTypeRelDoc = newRec.getSublistValue({
                        sublistId: 'recmachcustrecord_mx_rcs_orig_trans',
                        fieldId: 'custrecord_mx_rcs_rel_type',
                        line: index
                    }) || '';
                    
                    // Obtiene el nombre para mostrar del documento relacionado
                    displayRelDoc = newRec.getSublistValue({
                        sublistId: 'recmachcustrecord_mx_rcs_orig_trans',
                        fieldId: 'custrecord_mx_rcs_rel_cfdi_display',
                        line: index
                    }) || '';

                    // Agrega los valores obtenidos al arreglo de datos
                    respuesta.data.push({
                        "relDocUUID": uuidRelDoc,
                        "relDocNombre": displayRelDoc,
                        "relDocTipoRel": relTypeRelDoc
                    });
                }

                // Log de la respuesta armada
                log.audit({ title: 'respuesta ' + index, details: JSON.stringify(respuesta) });

                // Actualiza el campo 'custbody_drt_tipo_cambio_uuid' del registro
                var tranid = record.submitFields({
                    id: recId,
                    type: recType,
                    values: {
                        'custbody_drt_tipo_cambio_uuid': JSON.stringify(respuesta.data)
                    },
                    options: {
                        enableSourcing: false,          // No recalcular campos derivados
                        ignoreMandatoryFields: true    // Ignorar validaciones de campos obligatorios
                    }
                });

                // Log del resultado de submitFields
                log.audit({ title: 'tranid', details: JSON.stringify(tranid) });
            }
        } catch (error) {
            // Captura y registra cualquier error que ocurra
            log.error({ title: 'error afterSubmit', details: JSON.stringify(error) });
        }
    }

    return {
        afterSubmit: afterSubmit
    }
});
