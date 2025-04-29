/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * @author Saul Ivan Angulo Varela
 * @company IT Almetal
 * @date 2025-04-29
 * @description Script para identificar los IDs de campos (columnas) en una sublista personalizada basada en una búsqueda guardada.
 * Sublista objetivo: 'customsublist17'
 */

define(['N/currentRecord'], function (currentRecord) {

    function pageInit(context) {
        try {
            var rec = currentRecord.get();
            var sublistId = 'customsublist17';
            var lineCount = rec.getLineCount({ sublistId: sublistId });

            if (lineCount > 0) {
                console.log('La sublista "' + sublistId + '" tiene ' + lineCount + ' líneas.');

                var fieldIds = [];
                var testLine = 0;

                // Campos comunes que se pueden intentar leer
                var knownFields = ['internalid', 'name', 'email', 'amount', 'entity', 'status'];

                knownFields.forEach(function (fieldId) {
                    try {
                        var value = rec.getSublistValue({
                            sublistId: sublistId,
                            fieldId: fieldId,
                            line: testLine
                        });
                        fieldIds.push({ fieldId: fieldId, value: value });
                    } catch (e) {
                        // Ignorar si el campo no existe
                    }
                });

                console.log('Campos identificados en la sublista:', fieldIds);
            } else {
                console.log('La sublista "' + sublistId + '" no tiene líneas.');
            }

        } catch (error) {
            console.error('Error detectando campos en la sublista:', error);
        }
    }

    return {
        pageInit: pageInit
    };

});
