/**
 * Crafted by ZIgi
 */

Ext.namespace('M3Designer.ui');

/*
* ����� ����������� ������ ����������� ����������� �3 ����������. ������ �� ������������ ���������?
* �� ������ ����� �� ���� ��������, �� ������ ����������� �3 �������� �������� ����� � �� ������������ xtype
*/

M3Designer.ui.DictSelectMock = Ext.extend(Ext.form.TwinTriggerField, {
    width:150,
    trigger1Class:'x-form-clear-trigger',
    trigger2Class:'x-form-select-trigger',
    initComponent:function() {
        M3Designer.ui.DictSelectMock.superclass.initComponent.call(this);
    }
});

Ext.reg('designer-dict-select', M3Designer.ui.DictSelectMock);