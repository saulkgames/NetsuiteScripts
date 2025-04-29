/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * @author Saul Ivan Angulo Varela
 * @company IT Almetal
 * @date 2025-04-28
 * @description Client Script que obtiene y muestra todos los IDs de sublistas disponibles en el registro actual en consola.
 */

define(['N/currentRecord'], function(currentRecord) {

    function pageInit(context) {
        try {
            var rec = currentRecord.get();
            var sublists = rec.getSublists();

            console.log('--- SUBLISTAS DISPONIBLES ---');
            console.log(sublists);

        } catch (error) {
            console.error('Error obteniendo sublistas:', error);
        }
    }

    return {
        pageInit: pageInit
    };

});
