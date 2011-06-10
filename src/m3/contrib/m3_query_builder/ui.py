#coding:utf-8 
'''
Date&Time: 01.06.11 10:28
@author: kir
'''
from m3.ui.ext.all_components import *

from m3.helpers import urls

class QueryBuilderWindow(ExtWindow):

    def __init__(self, params={}, *args, **kwargs):
        super(QueryBuilderWindow, self).__init__(*args, **kwargs)
        self.initialize()
        
        #Как бы хак        
        self.button_align = ExtWindow.align_left
        
        #Добавляем элементы в таб панель
        self.tab_main.items.extend([self.init_tables_and_connections(),
                                          self.init_fields(),
                                          self.init_grouping(),
                                          self.init_conditions()])

        self.params = params
        
        # Настройка редактирования колонок
        self.grd_selected_fields.editor = True
        self.clmn_alias.editor = ExtStringField()
        self.clmn_sorting.editor = ExtCheckBox()

    def initialize(self):
        '''AUTOGENERATED'''
        self.layout = 'fit'
        self.title = u'Редактор запросов'
        self.min_height = 600
        self.height = 600
        self.min_width = 800
        self.width = 800
        self.maximizable = True
        self.template_globals = 'qb-window.js'
        self.minimizable = True
        
        tb_main_tabpanel = ExtToolBar()
        tb_main_tabpanel.layout = 'toolbar'
        
        btn_query_text = ExtButton()
        btn_query_text.text = u'Показать текст запроса'
        btn_query_text.icon_cls = 'icon-script-code'
        
        tbfill_tab = ExtToolBar.Fill()
        
        btn_run_query = ExtButton()
        btn_run_query.text = u'Выполнить'
        btn_run_query.icon_cls = 'icon-script-lightning'
        
        btn_save_query = ExtButton()
        btn_save_query.text = u'Сохранить'
        btn_save_query.icon_cls = 'icon-script-save'
        
        btn_close = ExtButton()
        btn_close.text = u'Закрыть'
        btn_close.icon_cls = 'icon-door-out'
        btn_close.handler = 'winClose'
        
        tab_main = ExtTabPanel()
        tab_main.title = 'New panel'
        tab_main.active_tab = 0
        tab_main.body_border = False
        tab_main.header = True
        tab_main.border = False
        
        self.footer_bar = tb_main_tabpanel
        
        tb_main_tabpanel.items.extend([btn_query_text, tbfill_tab, btn_run_query, btn_save_query, btn_close])
        self.items.extend([tab_main])
        
        self.tb_main_tabpanel = tb_main_tabpanel
        self.btn_query_text = btn_query_text
        self.tbfill_tab = tbfill_tab
        self.btn_run_query = btn_run_query
        self.btn_save_query = btn_save_query
        self.btn_close = btn_close
        self.tab_main = tab_main

                                        
    def init_tables_and_connections(self, container_class=ExtPanel):
        cont = container_class()
        cont.layout = 'border'
        cont.title = u'Таблицы и связи'
        
        cnt_container_2 = ExtContainer()
        cnt_container_2.region = 'center'
        cnt_container_2.layout = 'border'
        
        grd_selected_entities = ExtGrid()
        grd_selected_entities.drag_drop = True
        grd_selected_entities.layout = 'auto'
        grd_selected_entities.title = u'Выбранные сущности'
        grd_selected_entities.region = 'north'
        grd_selected_entities.drag_drop_group = 'selectedEntities'
        grd_selected_entities.height = 200
        grd_selected_entities.header = True
        
        store_selected_entities = ExtDataStore()
        store_selected_entities.id_index = 0
        
        entity_name = ExtGridColumn()
        entity_name.header = u'Наименование'
        entity_name.data_index = 'entityName'
        entity_name.menu_disabled = True
        
        grd_links = ExtGrid()
        grd_links.layout = 'auto'
        grd_links.title = u'Связи между выбранными сущностями'
        grd_links.region = 'center'
        grd_links.header = True
        
        tb_selected_entities = ExtToolBar()
        tb_selected_entities.layout = 'toolbar'
        
        btn_select_link = ExtButton()
        btn_select_link.text = u'Выбрать связь'
        btn_select_link.icon_cls = 'icon-link-add'
        btn_select_link.handler = 'selectConnection'
        
        btn_delete_link = ExtButton()
        btn_delete_link.name = 'deleteConnection'
        btn_delete_link.text = u'Удалить связь'
        btn_delete_link.handler = 'deleteConnection'
        btn_delete_link.icon_cls = 'icon-link-delete'
        grd_links.layout_config = {'forceFit': True}
        
        dstore_links = ExtDataStore()
        
        clmn_entity_first = ExtGridColumn()
        clmn_entity_first.header = u'Сущность 1'
        clmn_entity_first.data_index = 'entityFirst'
        clmn_entity_first.menu_disabled = True
        
        clmn_entity_first_type = ExtGridColumn()
        clmn_entity_first_type.menu_disabled = True
        clmn_entity_first_type.header = u'Вн.'
        clmn_entity_first_type.width = 30
        clmn_entity_first_type.data_index = 'outerFirst'
        
        clmn_entity_second = ExtGridColumn()
        clmn_entity_second.header = u'Сущность 2'
        clmn_entity_second.data_index = 'entitySecond'
        clmn_entity_second.menu_disabled = True
        
        clmn_entity_second_type = ExtGridColumn()
        clmn_entity_second_type.menu_disabled = True
        clmn_entity_second_type.header = u'Вн.'
        clmn_entity_second_type.width = 30
        clmn_entity_second_type.data_index = 'outerSecond'
        
        clmn_descr = ExtGridColumn()
        clmn_descr.header = u'Тип связи'
        clmn_descr.data_index = 'value'
        clmn_descr.menu_disabled = True
        
        tree_entities = ExtTree()
        tree_entities.title = u'Дерево схем'
        tree_entities.url = urls.get_action('m3-query-builder-entities-list').absolute_url()
        tree_entities.drag_drop = True
        tree_entities.drag_drop_group = 'TreeDD'
        tree_entities.header = True
        tree_entities.width = 250
        tree_entities.drag_drop = True
        tree_entities.region = 'west'
        
        clmn_gridColumn_8 = ExtGridColumn()
        clmn_gridColumn_8.header = u'Схемы'
        clmn_gridColumn_8.data_index = 'schemes'
        clmn_gridColumn_8.menu_disabled = True
        
        grd_selected_entities.store = store_selected_entities
        grd_links.top_bar = tb_selected_entities
        grd_links.store = dstore_links
        
        grd_selected_entities.columns.extend([entity_name])
        tb_selected_entities.items.extend([btn_select_link, btn_delete_link])
        grd_links.columns.extend([clmn_entity_first, clmn_entity_first_type, clmn_entity_second, clmn_entity_second_type, clmn_descr])
        cnt_container_2.items.extend([grd_selected_entities, grd_links])
        tree_entities.columns.extend([clmn_gridColumn_8])
        cont.items.extend([cnt_container_2, tree_entities])
        
        self.cnt_container_2 = cnt_container_2
        self.grd_selected_entities = grd_selected_entities
        self.store_selected_entities = store_selected_entities
        self.entity_name = entity_name
        self.grd_links = grd_links
        self.tb_selected_entities = tb_selected_entities
        self.btn_select_link = btn_select_link
        self.btn_delete_link = btn_delete_link
        self.dstore_links = dstore_links
        self.clmn_entity_first = clmn_entity_first
        self.clmn_entity_first_type = clmn_entity_first_type
        self.clmn_entity_second = clmn_entity_second
        self.clmn_entity_second_type = clmn_entity_second_type
        self.clmn_descr = clmn_descr
        self.tree_entities = tree_entities
        self.clmn_gridColumn_8 = clmn_gridColumn_8
        
        return cont

                                                                                                                                                                        
    def init_fields(self, container_class=ExtPanel):
        cont = container_class()
        cont.layout = 'border'
        cont.title = u'Поля'
        cont.padding = '10px'
        
        pnl_panel_2 = ExtPanel()
        pnl_panel_2.layout = 'auto'
        pnl_panel_2.title = u'Опции'
        pnl_panel_2.region = 'north'
        pnl_panel_2.height = 80
        pnl_panel_2.padding = '5px'
        pnl_panel_2.header = True
        
        chk_distinct = ExtCheckBox()
        chk_distinct.box_label = u'Различные'
        chk_distinct.checked = False
        
        cnt_limit = ExtContainer()
        cnt_limit.layout = 'hbox'
        
        chk_limit = ExtCheckBox()
        chk_limit.width = 150
        chk_limit.box_label = u'Количество записей'
        
        nmbr_limit_count = ExtNumberField()
        nmbr_limit_count.flex = 0
        
        tree_all_fields = ExtTree()
        tree_all_fields.allow_container_drop = False
        tree_all_fields.layout = 'auto'
        tree_all_fields.root_text = 'Root'
        tree_all_fields.width = 250
        tree_all_fields.region = 'west'
        tree_all_fields.drag_drop = False
        tree_all_fields.drag_drop_group = 'TreeDD'
        tree_all_fields.allow_parent_insert = False
        tree_all_fields.header = False
        tree_all_fields.enable_drag = True
        
        clmn_fields_entities = ExtGridColumn()
        clmn_fields_entities.header = u'Схемы'
        clmn_fields_entities.data_index = 'fields_entities'
        clmn_fields_entities.menu_disabled = True
        
        grd_selected_fields = ExtGrid()
        grd_selected_fields.layout = 'auto'
        grd_selected_fields.region = 'center'
        grd_selected_fields.header = False
        
        tb_selected_fields = ExtToolBar()
        tb_selected_fields.layout = 'toolbar'
        
        btn_button_4 = ExtButton()
        btn_button_4.text = u'Добавить'
        btn_button_4.icon_cls = 'add_item'
        btn_button_4.handler = 'addSelectField'
        
        btn_button_3 = ExtButton()
        btn_button_3.text = u'Удалить'
        btn_button_3.icon_cls = 'delete_item'
        btn_button_3.handler = 'deleteSelectField'
        
        tbsep_toolbarseparator_1 = ExtToolBar.Separator()
        
        btn_up_field = ExtButton()
        btn_up_field.text = u'Вверх'
        btn_up_field.icon_cls = 'icon-arrow-up'
        btn_up_field.handler = 'fieldUp'
        
        btn_down_field = ExtButton()
        btn_down_field.text = u'Вниз'
        btn_down_field.icon_cls = 'icon-arrow-down'
        btn_down_field.handler = 'fieldDown'
        
        astore_selected_fields = ExtDataStore()
        astore_selected_fields.store_id = 'newArrayStore'
        astore_selected_fields.id_index = 0
        
        clmn_select_grd_entity = ExtGridColumn()
        clmn_select_grd_entity.menu_disabled = True
        clmn_select_grd_entity.header = 'column'
        clmn_select_grd_entity.data_index = 'entity'
        clmn_select_grd_entity.hidden = True
        
        clmn_selected_field = ExtGridColumn()
        clmn_selected_field.header = u'Выбранное поле'
        clmn_selected_field.data_index = 'selectedField'
        clmn_selected_field.menu_disabled = True
        
        clmn_alias = ExtGridColumn()
        clmn_alias.header = u'Алиас'
        clmn_alias.data_index = 'alias'
        clmn_alias.menu_disabled = True
        
        clmn_sorting = ExtGridColumn()
        clmn_sorting.menu_disabled = True
        clmn_sorting.header = u'Сортировка'
        clmn_sorting.width = 80
        clmn_sorting.data_index = 'sorting'
        
        grd_selected_fields.top_bar = tb_selected_fields
        grd_selected_fields.store = astore_selected_fields
        
        cnt_limit.items.extend([chk_limit, nmbr_limit_count])
        pnl_panel_2.items.extend([chk_distinct, cnt_limit])
        tree_all_fields.columns.extend([clmn_fields_entities])
        tb_selected_fields.items.extend([btn_button_4, btn_button_3, tbsep_toolbarseparator_1, btn_up_field, btn_down_field])
        grd_selected_fields.columns.extend([clmn_select_grd_entity, clmn_selected_field, clmn_alias, clmn_sorting])
        cont.items.extend([pnl_panel_2, tree_all_fields, grd_selected_fields])
        
        self.pnl_panel_2 = pnl_panel_2
        self.chk_distinct = chk_distinct
        self.cnt_limit = cnt_limit
        self.chk_limit = chk_limit
        self.nmbr_limit_count = nmbr_limit_count
        self.tree_all_fields = tree_all_fields
        self.clmn_fields_entities = clmn_fields_entities
        self.grd_selected_fields = grd_selected_fields
        self.tb_selected_fields = tb_selected_fields
        self.btn_button_4 = btn_button_4
        self.btn_button_3 = btn_button_3
        self.tbsep_toolbarseparator_1 = tbsep_toolbarseparator_1
        self.btn_up_field = btn_up_field
        self.btn_down_field = btn_down_field
        self.astore_selected_fields = astore_selected_fields
        self.clmn_select_grd_entity = clmn_select_grd_entity
        self.clmn_selected_field = clmn_selected_field
        self.clmn_alias = clmn_alias
        self.clmn_sorting = clmn_sorting
        
        return cont

                                                                                                                                                                                                                                                                                                
    def init_grouping(self, container_class=ExtPanel):
        cont = container_class()
        cont.layout = 'border'
        cont.title = u'Группировка'
        
        tree_groups_fields = ExtTree()
        tree_groups_fields.layout = 'auto'
        tree_groups_fields.width = 250
        tree_groups_fields.region = 'west'
        tree_groups_fields.title = u'Поля'
        tree_groups_fields.root_text = 'Root'
        tree_groups_fields.header = False
        
        clmn_fields_entities = ExtGridColumn()
        clmn_fields_entities.header = u'Поля'
        clmn_fields_entities.data_index = 'fields_entities'
        clmn_fields_entities.menu_disabled = True
        
        cnt_container_1 = ExtContainer()
        cnt_container_1.region = 'center'
        cnt_container_1.layout = 'border'
        
        grd_gridpanel_1 = ExtGrid()
        grd_gridpanel_1.layout = 'auto'
        grd_gridpanel_1.title = u'Групповые поля'
        grd_gridpanel_1.region = 'north'
        grd_gridpanel_1.height = 250
        grd_gridpanel_1.header = True
        
        jstore_jsonstore_2 = ExtJsonStore()
        jstore_jsonstore_2.id_property = 'id'
        jstore_jsonstore_2.store_id = 'newJsonStore'
        
        clmn_gridColumn_2 = ExtGridColumn()
        clmn_gridColumn_2.header = u'Наименование'
        clmn_gridColumn_2.data_index = 'name'
        clmn_gridColumn_2.menu_disabled = True
        
        grd_gridpanel_2 = ExtGrid()
        grd_gridpanel_2.layout = 'auto'
        grd_gridpanel_2.title = u'Суммируемые поля'
        grd_gridpanel_2.region = 'center'
        grd_gridpanel_2.header = True
        
        jstore_select_entities = ExtJsonStore()
        jstore_select_entities.id_property = 'id'
        jstore_select_entities.store_id = 'newJsonStore'
        
        clmn_gridColumn_3 = ExtGridColumn()
        clmn_gridColumn_3.header = u'Суммируемое поле'
        clmn_gridColumn_3.data_index = 'summable_field'
        clmn_gridColumn_3.menu_disabled = True
        
        clmn_gridColumn_4 = ExtGridColumn()
        clmn_gridColumn_4.header = u'Функцция'
        clmn_gridColumn_4.data_index = 'function'
        clmn_gridColumn_4.menu_disabled = True
        
        grd_gridpanel_1.store = jstore_jsonstore_2
        grd_gridpanel_2.store = jstore_select_entities
        
        tree_groups_fields.columns.extend([clmn_fields_entities])
        grd_gridpanel_1.columns.extend([clmn_gridColumn_2])
        grd_gridpanel_2.columns.extend([clmn_gridColumn_3, clmn_gridColumn_4])
        cnt_container_1.items.extend([grd_gridpanel_1, grd_gridpanel_2])
        cont.items.extend([tree_groups_fields, cnt_container_1])
        
        self.tree_groups_fields = tree_groups_fields
        self.clmn_fields_entities = clmn_fields_entities
        self.cnt_container_1 = cnt_container_1
        self.grd_gridpanel_1 = grd_gridpanel_1
        self.jstore_jsonstore_2 = jstore_jsonstore_2
        self.clmn_gridColumn_2 = clmn_gridColumn_2
        self.grd_gridpanel_2 = grd_gridpanel_2
        self.jstore_select_entities = jstore_select_entities
        self.clmn_gridColumn_3 = clmn_gridColumn_3
        self.clmn_gridColumn_4 = clmn_gridColumn_4
        
        return cont

                                        
    def init_conditions(self, container_class=ExtPanel):
        cont = container_class()
        cont.layout = 'border'
        cont.title = u'Условия'
        
        tree_conditions_fields = ExtTree()
        tree_conditions_fields.flex = 0
        tree_conditions_fields.layout = 'auto'
        tree_conditions_fields.title = u'Все поля'
        tree_conditions_fields.region = 'west'
        tree_conditions_fields.root_text = 'Root'
        tree_conditions_fields.header = True
        tree_conditions_fields.width = 250
        
        clmn_fields_entities = ExtGridColumn()
        clmn_fields_entities.header = u'Условия'
        clmn_fields_entities.data_index = 'fields_entities'
        clmn_fields_entities.menu_disabled = True
        
        grd_gridpanel_1 = ExtGrid()
        grd_gridpanel_1.layout = 'auto'
        grd_gridpanel_1.title = u'Условия'
        grd_gridpanel_1.region = 'center'
        grd_gridpanel_1.header = True
        
        jstore_select_entities = ExtJsonStore()
        jstore_select_entities.id_property = 'id'
        jstore_select_entities.store_id = 'newJsonStore'
        
        clmn_gridColumn_2 = ExtGridColumn()
        clmn_gridColumn_2.header = u'Условия'
        clmn_gridColumn_2.data_index = 'conditions'
        clmn_gridColumn_2.menu_disabled = True
        
        grd_gridpanel_1.store = jstore_select_entities
        
        tree_conditions_fields.columns.extend([clmn_fields_entities])
        grd_gridpanel_1.columns.extend([clmn_gridColumn_2])
        cont.items.extend([tree_conditions_fields, grd_gridpanel_1])
        
        self.tree_conditions_fields = tree_conditions_fields
        self.clmn_fields_entities = clmn_fields_entities
        self.grd_gridpanel_1 = grd_gridpanel_1
        self.jstore_select_entities = jstore_select_entities
        self.clmn_gridColumn_2 = clmn_gridColumn_2
        
        return cont

                                                
class SelectConnectionsWindow(ExtWindow):

    def __init__(self, *args, **kwargs):
        super(SelectConnectionsWindow, self).__init__(*args, **kwargs)
        self.initialize()

    def initialize(self):
        '''AUTOGENERATED'''
        self.layout = 'border'
        self.modal = True
        self.title = u'Выбранные схемы'
        self.min_height = 300
        self.height = 450
        self.min_width = 400
        self.width = 550
        self.maximizable = False
        self.template_globals = 'qb-connection-window.js'
        self.minimizable = False
        
        tb_buttons = ExtToolBar()
        tb_buttons.layout = 'toolbar'
        
        btn_select = ExtButton()
        btn_select.text = u'Выбрать'
        btn_select.handler = 'selectLinks'
        
        btn_cancel = ExtButton()
        btn_cancel.text = u'Отмена'
        btn_cancel.handler = 'function(){ win.close() }'
        
        cnt_main = ExtContainer()
        cnt_main.layout = 'hbox'
        cnt_main.region = 'center'
        cnt_main.height = 200
        cnt_main.layout_config = {'align': 'stretch'}
        
        tree_entities_fields_first = ExtTree()
        tree_entities_fields_first.flex = '1'
        tree_entities_fields_first.layout = 'auto'
        tree_entities_fields_first.root_text = 'Root'
        tree_entities_fields_first.header = False
        
        clmn_fields_entities_first = ExtGridColumn()
        clmn_fields_entities_first.header = u'Схема'
        clmn_fields_entities_first.data_index = 'fields_entities'
        clmn_fields_entities_first.menu_disabled = True
        
        tree_entities_fields_second = ExtTree()
        tree_entities_fields_second.flex = '1'
        tree_entities_fields_second.layout = 'auto'
        tree_entities_fields_second.root_text = 'Root'
        tree_entities_fields_second.header = False
        
        clmn_fields_entities_second = ExtGridColumn()
        clmn_fields_entities_second.header = u'Схема'
        clmn_fields_entities_second.data_index = 'fields_entities'
        clmn_fields_entities_second.menu_disabled = True
        
        cnt_south = ExtContainer()
        cnt_south.layout = 'hbox'
        cnt_south.region = 'south'
        cnt_south.height = 35
        cnt_south.style = {'padding': '5px'}
        
        chk_link_first = ExtCheckBox()
        chk_link_first.flex = 1
        chk_link_first.box_label = u'Внешняя связь'
        
        chk_link_second = ExtCheckBox()
        chk_link_second.flex = 1
        chk_link_second.box_label = u'Внешняя связь'
        
        self.footer_bar = tb_buttons
        
        tb_buttons.items.extend([btn_select, btn_cancel])
        tree_entities_fields_first.columns.extend([clmn_fields_entities_first])
        tree_entities_fields_second.columns.extend([clmn_fields_entities_second])
        cnt_main.items.extend([tree_entities_fields_first, tree_entities_fields_second])
        cnt_south.items.extend([chk_link_first, chk_link_second])
        self.items.extend([cnt_main, cnt_south])
        
        self.tb_buttons = tb_buttons
        self.btn_select = btn_select
        self.btn_cancel = btn_cancel
        self.cnt_main = cnt_main
        self.tree_entities_fields_first = tree_entities_fields_first
        self.clmn_fields_entities_first = clmn_fields_entities_first
        self.tree_entities_fields_second = tree_entities_fields_second
        self.clmn_fields_entities_second = clmn_fields_entities_second
        self.cnt_south = cnt_south
        self.chk_link_first = chk_link_first
        self.chk_link_second = chk_link_second

        