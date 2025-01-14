/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/runtime', 'N/record', 'N/format'],

  (serverWidget, search, runtime, record, format) => {
    /**
                 * Defines the Suitelet script trigger point.
                 * @param {Object} scriptContext
                 * @param {ServerRequest} scriptContext.request - Incoming request
                 * @param {ServerResponse} scriptContext.response - Suitelet response
                 * @since 2015.2
                 */
    const onRequest = (scriptContext) => {
      var responseToSend = scriptContext.response;
      var serviceRequest = scriptContext.request;
      var service_response = {
        success: false
      };
      try {
        log.audit({ title: 'serviceRequest.method?', details: serviceRequest.method });
        const form = corteCaja();
        responseToSend.writePage({
          pageObject: form
        });
        if (serviceRequest.method == 'POST') {
          const url_params = serviceRequest.parameters;
          log.audit({ title: 'url params', details: url_params });
          if (url_params.flg == 'true' || url_params.flg == true) {
            const create_Record = createRecord(serviceRequest.body);
            if (create_Record.success) {
              service_response.success = true;
              service_response.msg = create_Record.msg;

              responseToSend.write({ output: JSON.stringify(service_response) });
            }
          }
        }

      } catch (error) {
        log.error({ title: 'ERROR on onRequest', details: error });
      }
    };

    const corteCaja = () => {
      try {
        const form = serverWidget.createForm({
          title: 'Corte de Caja'
        });

        form.addSubtab({
          id: 'subtab_cuadre_caja',
          label: 'Transacciones'
        });

        form.addSubtab({
          id: 'subtab_cheques',
          label: 'Cheques'
        });

        form.clientScriptModulePath = './drt_cuadre_caja_tools_cs.js';

        // * Campos de cabecera
        // Número de registo
        const record_id_field = form.addField({
          id: 'custpage_record_id',
          label: '#REGISTRO',
          type: serverWidget.FieldType.TEXT
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
        record_id_field.defaultValue = 'Por generar...';

        // Fecha
        const today = format.format({
          value: new Date(),
          type: format.Type.DATE
        });
        log.audit({
          title: 'fecha?',
          details: today
        });
        const date_field = form.addField({
          id: 'custpage_date',
          label: 'FECHA',
          type: serverWidget.FieldType.DATE
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
        date_field.defaultValue = today;

        // Razon de cuadre
        const reason_field = form.addField({
          id: 'custpage_reason',
          label: 'RAZÓN DE CUADRE',
          type: serverWidget.FieldType.SELECT
        });
        reason_field.addSelectOption({
          value: 'ignore',
          text: '-Selecciona una razón-'
        });
        const reason_list = getReasonList();
        log.audit({ title: 'lista de razones?', details: reason_list });

        if (reason_list.success) {
          for (let index = 0; index < reason_list.data.length; index++) {
            const element_reason = reason_list.data[index];
            reason_field.addSelectOption({
              value: element_reason.id,
              text: element_reason.name
            });
          }
        }

        // Ubicacion
        const userObj = runtime.getCurrentUser();
        log.audit({
          title: 'user?',
          details: userObj
        });
        const searchLocation = search.lookupFields({
          type: 'employee',
          id: userObj.id,
          columns: ['custentity_drt_ub_caudre_caja']
        })['custentity_drt_ub_caudre_caja'];
        
        const locationEmployee = searchLocation?.[0]?.value; 
        const searchAccounts = locationEmployee ? search.lookupFields({
          type: 'location',
          id: locationEmployee,
          columns: ['custrecord_drt_nc_account', 'custrecord_drt_account_d']
        }) : '';
        const accountDeposit = searchAccounts.custrecord_drt_account_d?.[0]?.value;
        const accpuntCash = searchAccounts.custrecord_drt_nc_account?.[0]?.value;
        const location_field = form.addField({
          id: 'custpage_location',
          label: 'UBICACIÓN',
          type: serverWidget.FieldType.SELECT,
          source: record.Type.LOCATION
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
        location_field.defaultValue = locationEmployee;

        // # Depósito
        form.addField({
          id: 'custpage_deposit_num',
          label: '# DEPÓSITO',
          type: serverWidget.FieldType.TEXT 
        });

        const account_deposit_field = form.addField({
          id: 'custpage_deposit_account',
          label: 'CUENTA DEPÓSITO',
          type: serverWidget.FieldType.SELECT,
          source: record.Type.ACCOUNT
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
        account_deposit_field.defaultValue = accountDeposit;

        // Subsidiaria
        const subsidiaria_field = form.addField({
          id: 'custpage_subsidiary',
          label: 'SUBSIDIARIA',
          source: 'subsidiary',
          type: serverWidget.FieldType.SELECT
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
        subsidiaria_field.defaultValue = userObj.subsidiary;

        const cuenta_caja_field = form.addField({
          id: 'custpage_account_caja',
          label: 'CUENTA CAJA',
          type: serverWidget.FieldType.SELECT,
          source: record.Type.ACCOUNT
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
        cuenta_caja_field.defaultValue = accpuntCash;

        // Usuario
        const usuario_field = form.addField({
          id: 'custpage_usuario',
          label: 'USUARIO',
          type: serverWidget.FieldType.SELECT,
          source: record.Type.EMPLOYEE
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
        usuario_field.defaultValue = userObj.id;

        // Nota
        form.addField({
          id: 'custpage_nota',
          label: 'NOTA',
          type: serverWidget.FieldType.TEXTAREA
        });

        // Importe
        form.addField({
          id: 'custpage_importe',
          label: 'IMPORTE',
          type: serverWidget.FieldType.CURRENCY
          // type: serverWidget.FieldType.TEXT
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

        // Importe a cuadrar
        form.addField({
          id: 'custpage_importe_a_cuadrar',
          label: 'IMPORTE A CUADRAR',
          type: serverWidget.FieldType.CURRENCY
          // type: serverWidget.FieldType.TEXT
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

        // ? Campo auxiliar para los calculos
        const aux_field = form.addField({
          id: 'custpage_aux_calculos',
          label: 'aux_calculos',
          type: serverWidget.FieldType.TEXTAREA
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
        aux_field.defaultValue = '[]';

        // ? Campo auxiliar para los calculos (cheques)
        const aux_field_cheques = form.addField({
          id: 'custpage_aux_calculos_cheques',
          label: 'aux_calculos_cheques',
          type: serverWidget.FieldType.TEXTAREA
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
        aux_field_cheques.defaultValue = '[]';

        // Sublista de transacciones
        const transaction_sublist = form.addSublist({
          id: 'transaction_sublist',
          type: serverWidget.SublistType.LIST,
          tab: 'subtab_cuadre_caja',
          // type : serverWidget.SublistType.INLINEEDITOR,
          label: 'Transacciones'
        });
        // seleccionar
        transaction_sublist.addField({
          id: 'seleccion_sub_field',
          label: 'Seleccionar',
          type: serverWidget.FieldType.CHECKBOX
        });

        // tranid
        transaction_sublist.addField({
          id: 'tran_id_sub_field',
          label: 'Pago - Venta en efectivo',
          type: serverWidget.FieldType.SELECT,
          source: 'transaction'
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
        transaction_sublist.addField({
          id: 'tran_type_sub_field',
          label: 'Tipo de transaccion',
          type: serverWidget.FieldType.TEXT,
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

        // fecha
        transaction_sublist.addField({
          id: 'fecha_sub_field',
          label: 'Fecha - pago',
          type: serverWidget.FieldType.TEXT
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

        // importe
        transaction_sublist.addField({
          id: 'importe_sub_field',
          label: 'Importe',
          type: serverWidget.FieldType.TEXT
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.NORMAL });
        const transactions = getTransactions(accpuntCash, userObj.subsidiary, locationEmployee);
        log.audit({ title: 'transacciones obtenidas?', details: transactions });

        if (transactions.success) {
          for (let index = 0; index < transactions.data.length; index++) {
            const tran_element = transactions.data[index];

            transaction_sublist.setSublistValue({
              id: 'tran_id_sub_field',
              line: index,
              value: tran_element.id
            });
            transaction_sublist.setSublistValue({
              id: 'tran_type_sub_field',
              line: index,
              value: tran_element.type.toLowerCase()
            });
            transaction_sublist.setSublistValue({
              id: 'fecha_sub_field',
              line: index,
              value: tran_element.trandate
            });
            transaction_sublist.setSublistValue({
              id: 'importe_sub_field',
              line: index,
              value: tran_element.amount
            });
          }
        }

        // Sublista de cheques
        const cheques_sublist = form.addSublist({
          id: 'cheques_sublist',
          // type: serverWidget.SublistType.LIST,
          tab: 'subtab_cheques',
          type: serverWidget.SublistType.INLINEEDITOR,
          label: 'Cheques'
        });
        // #Cheque
        cheques_sublist.addField({
          id: 'num_cheque_sub_field_chq',
          label: '#Cheque',
          type: serverWidget.FieldType.TEXT
        });
        // Importe
        cheques_sublist.addField({
          id: 'importe_sub_field_chq',
          label: 'Importe',
          type: serverWidget.FieldType.FLOAT
        });
        // Beneficiario
        cheques_sublist.addField({
          id: 'beneficiario_sub_field_chq',
          label: 'Beneficiario',
          type: serverWidget.FieldType.SELECT,
          source: 'subsidiary'
        });
        // Fecha
        cheques_sublist.addField({
          id: 'fecha_sub_field_chq',
          label: 'Fecha',
          type: serverWidget.FieldType.DATE
        });
        // Banco
        cheques_sublist.addField({
          id: 'banco_sub_field_chq',
          label: 'Banco',
          type: serverWidget.FieldType.TEXT
        });
        // Cuenta
        const account = cheques_sublist.addField({
          id: 'cuenta_sub_field_chq',
          label: 'Cuenta',
          type: serverWidget.FieldType.TEXT
        });
        account.maxLength = 18;
        form.addButton({
          id: 'buttonid',
          label: 'Guardar cuadre de caja',
          functionName: 'createRecord()'
        });
        return form;
      } catch (error) {
        log.error({
          title: 'ERROR on corteCaja',
          details: error
        });
      }
    };

    const getReasonList = () => {
      const response = {
        success: false
      };
      const rsnList = [];
      try {
        const reasonSearch = search.create({
          type: 'customlist_drt_razones_cuadre_list',
          filters:
            [
              ['isinactive', 'is', 'F']
            ],
          columns:
            [
              'name',
              'internalid'
            ]
        });
        reasonSearch.run().each(function (result) {
          const rsnObj = {};

          rsnObj.id = result.getValue({ name: 'internalid' });
          rsnObj.name = result.getValue({ name: 'name' });

          rsnList.push(rsnObj);

          return true;
        });

        if (rsnList.length > 0) {
          response.success = true;
          response.data = rsnList;
        }
      } catch (error) {
        log.error({
          title: 'ERROR ON getReasonList()',
          details: error
        });
      }
      return response;
    };

    const getTransactions = (id_cuenta, subsidiary, location) => {
      log.debug('getTransactions', [id_cuenta, subsidiary]);
      const response = {
        success: false
      };
      const transactionArr = [];
      try {
        var transactionSearchObj = search.create({
          type: 'transaction',
          filters:
            [
              ['type', 'anyof', 'CustPymt', 'CashSale'],
              'AND',
              ['status', 'anyof', 'CashSale:C', 'CustPymt:C'],
              'AND',
              ['custbody_mx_txn_sat_payment_method', 'anyof', '1'],
              'AND',
              ['account', 'anyof', id_cuenta],
              'AND',
              ['mainline', 'is', 'T'],
              'AND',
              ['subsidiary', 'anyof', subsidiary],
              'AND', 
              ['custbody9','is','F'], 
              'AND', 
              ['custbody_drt_tran_cuadre_caja','anyof','@NONE@'],
              'AND',
              ['trandate','within','thisfiscalyear'],
              'AND',
              ['location','anyof', location]
            ],
          columns:
            [
              'internalid',
              'tranid',
              'trandate',
              'amount',
              'type'
            ]
        });
        var searchResultCount = transactionSearchObj.runPaged().count;
        log.debug('transactionSearchObj result count', searchResultCount);
        transactionSearchObj.run().each(function (result) {
          const transactionObj = {};

          transactionObj.id = result.getValue({ name: 'internalid' });
          transactionObj.tranid = result.getValue({ name: 'tranid' });
          transactionObj.trandate = result.getValue({ name: 'trandate' });
          transactionObj.amount = result.getValue({ name: 'amount' });
          transactionObj.type = result.getValue({ name: 'type' });

          transactionArr.push(transactionObj);
          return true;
        });

        if (transactionArr.length > 0) {
          response.success = true;
          response.data = transactionArr;
        }
      } catch (error) {
        log.error({
          title: 'ERROR on getTransactions',
          details: error
        });
      }
      return response;
    };

    const createRecord = (info_registro) => {
      const response = {
        success: false
      };
      try {
        log.audit({ title: 'info_registro? ', details: `${info_registro}` });
        const info = JSON.parse(info_registro);
        const tran_arr = JSON.parse(info.transactions);
        const cheques_arr = JSON.parse(info.cheques);

        const corte_record = record.create({
          type: 'customrecord1388',
          isDynamic: true
        });

        // Campos de cabecera
        corte_record.setValue({ fieldId: 'owner', value: info.usuario });
        corte_record.setValue({ fieldId: 'custrecord_drt_cc_num_deposito', value: info.num_deposito });
        corte_record.setValue({ fieldId: 'custrecord_drt_cc_razon', value: info.razon });
        corte_record.setValue({ fieldId: 'custrecord_drt_cc_subsidiaria', value: info.subsi });
        corte_record.setValue({ fieldId: 'custrecord_drt_cc_ubicacion', value: info.ubicacion });
        corte_record.setValue({ fieldId: 'custrecord_drt_cc_cuenta_caja', value: info.cta_caja });
        corte_record.setValue({ fieldId: 'custrecord_drt_cc_cuenta_depo', value: info.cta_deposito });
        corte_record.setValue({ fieldId: 'custrecord_drt_cc_importe', value: info.importe });
        corte_record.setValue({ fieldId: 'custrecord_drt_cc_imp_cuadrar', value: info.importe_cuadrar });
        corte_record.setValue({ fieldId: 'custrecord2', value: info.nota });


        //   // Campos de linea
        if (tran_arr.length > 0) {
          for (let index = 0; index < tran_arr.length; index++) {
            const element = tran_arr[index];

            corte_record.selectNewLine({
              sublistId: 'recmachcustrecord_drt_num_tcc'
            });
            corte_record.setCurrentSublistValue({
              sublistId: 'recmachcustrecord_drt_num_tcc',
              fieldId: 'custrecord_drt_num_doc_tcc',
              value: element.id,
            });
            corte_record.setCurrentSublistValue({
              sublistId: 'recmachcustrecord_drt_num_tcc',
              fieldId: 'custrecord_drt_fecha_tcc',
              value: new Date(element.date),
            });
            corte_record.setCurrentSublistValue({
              sublistId: 'recmachcustrecord_drt_num_tcc',
              fieldId: 'custrecord_drt_imp_tcc',
              value: element.amount,
            });
            corte_record.commitLine('recmachcustrecord_drt_num_tcc');
            
          }
        }
        if (cheques_arr.length > 0) {
          for (let index = 0; index < cheques_arr.length; index++) {
            const element = cheques_arr[index];
            const date = element.fecha ? new Date(element.fecha) : '';
            if (element.amount != '') {
              corte_record.selectNewLine({
                sublistId: 'recmachcustrecord_drt_num_cc_cheque'
              });
              corte_record.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_drt_num_cc_cheque',
                fieldId: 'custrecord_drt_num_cheque',
                value: element.num,
              });
              corte_record.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_drt_num_cc_cheque',
                fieldId: 'custrecord_drt_fecha_cheque',
                value: date,
              });
              corte_record.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_drt_num_cc_cheque',
                fieldId: 'custrecord_drt_bene_cheque',
                value: element.beneficiario,
              });
              corte_record.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_drt_num_cc_cheque',
                fieldId: 'custrecord_drt_imp_cheque',
                value: element.importe,
              });
              corte_record.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_drt_num_cc_cheque',
                fieldId: 'custrecord_drt_bank_cheque',
                value: element.banco,
              });
              corte_record.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_drt_num_cc_cheque',
                fieldId: 'custrecord_drt_cuenta_cheque',
                value: element.cuenta,
              });
              corte_record.commitLine('recmachcustrecord_drt_num_cc_cheque');
            }
            
          }
        }
        const id_loaded_corte = corte_record.save({ ignoreMandatoryFields: true, enableSourcing: false });
        if (id_loaded_corte) {
          
          for (let index = 0; index < tran_arr.length; index++) {
            const element = tran_arr[index];
            log.debug('element: ' , element);
            record.submitFields({
              type: element.type,
              id: element.id,
              values: {
                custbody_drt_tran_cuadre_caja: id_loaded_corte,
                custbody9: true
              },
            });
  
          }
        }
        log.audit({ title: 'id_loaded_corte', details: id_loaded_corte });
      } catch (error) {
        log.error({ title: 'ERROR ON createRecord', details: error });
      }
      return response;
    };
    return { onRequest };

  });
