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
        self.tab_tappanel_1.items.extend([self.init_tables_and_connections(),
                                          self.init_fields(),
                                          self.init_grouping(),
                                          self.init_conditions()])
        self.template_globals = 'query-builder-window.js'
        self.params = params

    def initialize(self):
        '''AUTOGENERATED'''
        self.layout = 'fit'
        self.title = u'Редактор запросов'
        self.maximizable = True
        self.minimizable = True
        self.min_height = 600
        self.height = 600
        self.min_width = 800
        self.width = 800

        tb_toolbar_1 = ExtToolBar()
        tb_toolbar_1.layout = 'toolbar'

        tbfill_toolbarfill_1 = ExtToolBar.Fill()

        query_text = ExtButton()
        query_text.text = u'Показать текст запроса'
        query_text.icon_cls = 'icon-script-code'

        run_query = ExtButton()
        run_query.text = u'Выполнить'
        run_query.icon_cls = 'icon-script-lightning'

        save_query = ExtButton()
        save_query.text = u'Сохранить'
        save_query.icon_cls = 'icon-script-save'

        close = ExtButton()
        close.text = u'Закрыть'
        close.handler = 'winClose'
        close.icon_cls = 'icon-door-out'

        tab_tappanel_1 = ExtTabPanel()
        tab_tappanel_1.title = 'New panel'
        tab_tappanel_1.active_tab = 0
        tab_tappanel_1.body_border = False
        tab_tappanel_1.header = True
        tab_tappanel_1.border = False

        self.footer_bar = tb_toolbar_1

        tb_toolbar_1.items.extend([query_text, tbfill_toolbarfill_1, run_query, save_query, close])
        self.items.extend([tab_tappanel_1])

        self.tb_toolbar_1 = tb_toolbar_1
        self.tbfill_toolbarfill_1 = tbfill_toolbarfill_1
        self.query_text = query_text
        self.run_query = run_query
        self.save_query = save_query
        self.close = close
        self.tab_tappanel_1 = tab_tappanel_1

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
        
        select_connection = ExtButton()
        select_connection.text = u'Выбрать связь'
        select_connection.icon_cls = 'icon-link-add'
        select_connection.handler = 'selectConnection'
        
        delete_connection = ExtButton()
        delete_connection.name = 'deleteConnection'
        delete_connection.text = u'Удалить связь'
        delete_connection.handler = 'deleteConnection'
        delete_connection.icon_cls = 'icon-link-delete'
        grd_links.layout_config = {'forceFit': True}
        
        jstore_links = ExtJsonStore()
        jstore_links.id_property = 'id'
        jstore_links.store_id = 'newJsonStore'
        
        clmn_number = ExtGridColumn()
        clmn_number.menu_disabled = True
        clmn_number.header = u'№'
        clmn_number.width = 30
        clmn_number.data_index = 'number'
        
        clmn_entity_first = ExtGridColumn()
        clmn_entity_first.header = u'Сущность 1'
        clmn_entity_first.data_index = 'entity_1'
        clmn_entity_first.menu_disabled = True
        
        clmn_entity_first_type = ExtGridColumn()
        clmn_entity_first_type.menu_disabled = True
        clmn_entity_first_type.header = u'Вн.'
        clmn_entity_first_type.width = 30
        clmn_entity_first_type.data_index = 'inner_1'
        
        clmn_entity_second = ExtGridColumn()
        clmn_entity_second.header = u'Сущность 2'
        clmn_entity_second.data_index = 'entity_2'
        clmn_entity_second.menu_disabled = True
        
        clmn_entity_second_type = ExtGridColumn()
        clmn_entity_second_type.menu_disabled = True
        clmn_entity_second_type.header = u'Вн.'
        clmn_entity_second_type.width = 30
        clmn_entity_second_type.data_index = 'inner_2'
        
        clmn_descr = ExtGridColumn()
        clmn_descr.header = u'Тип связи'
        clmn_descr.data_index = 'connection_type'
        clmn_descr.menu_disabled = True
        
        tree_entities = ExtTree()
        #tree_entities.layout = 'auto'
        tree_entities.title = u'Дерево схем'
        tree_entities.url = urls.get_action('m3-query-builder-entities-list').absolute_url()
        tree_entities.drag_drop_group = 'allEntities'
        #tree_entities.root_text = 'Root'
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
        grd_links.store = jstore_links
        
        grd_selected_entities.columns.extend([entity_name])
        tb_selected_entities.items.extend([select_connection, delete_connection])
        grd_links.columns.extend([clmn_number, clmn_entity_first, clmn_entity_first_type, clmn_entity_second, clmn_entity_second_type, clmn_descr])
        cnt_container_2.items.extend([grd_selected_entities, grd_links])
        tree_entities.columns.extend([clmn_gridColumn_8])
        cont.items.extend([cnt_container_2, tree_entities])
        
        self.cnt_container_2 = cnt_container_2
        self.grd_selected_entities = grd_selected_entities
        self.store_selected_entities = store_selected_entities
        self.entity_name = entity_name
        self.grd_links = grd_links
        self.tb_selected_entities = tb_selected_entities
        self.select_connection = select_connection
        self.delete_connection = delete_connection
        self.jstore_links = jstore_links
        self.clmn_number = clmn_number
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
        tree_all_fields.layout = 'auto'
        tree_all_fields.width = 250
        tree_all_fields.region = 'west'
        tree_all_fields.root_text = 'Root'
        tree_all_fields.header = False
        
        clmn_fields_entities = ExtGridColumn()
        clmn_fields_entities.header = u'Схемы'
        clmn_fields_entities.data_index = 'fields_entities'
        clmn_fields_entities.menu_disabled = True
        
        grd_selected_fields = ExtGrid()
        grd_selected_fields.layout = 'auto'
        grd_selected_fields.region = 'center'
        grd_selected_fields.header = False
        
        jstore_select_entities = ExtJsonStore()
        jstore_select_entities.id_property = 'id'
        jstore_select_entities.store_id = 'newJsonStore'
        
        clmn_gridColumn_1 = ExtGridColumn()
        clmn_gridColumn_1.header = u'Выбранное поле'
        clmn_gridColumn_1.data_index = 'selected_field'
        clmn_gridColumn_1.menu_disabled = True
        
        clmn_gridColumn_2 = ExtGridColumn()
        clmn_gridColumn_2.header = u'Алиас'
        clmn_gridColumn_2.data_index = 'alias'
        clmn_gridColumn_2.menu_disabled = True
        
        clmn_gridColumn_3 = ExtGridColumn()
        clmn_gridColumn_3.menu_disabled = True
        clmn_gridColumn_3.header = u'Сортировка'
        clmn_gridColumn_3.width = 80
        clmn_gridColumn_3.data_index = 'sorting'
        
        grd_selected_fields.store = jstore_select_entities
        
        cnt_limit.items.extend([chk_limit, nmbr_limit_count])
        pnl_panel_2.items.extend([chk_distinct, cnt_limit])
        tree_all_fields.columns.extend([clmn_fields_entities])
        grd_selected_fields.columns.extend([clmn_gridColumn_1, clmn_gridColumn_2, clmn_gridColumn_3])
        cont.items.extend([pnl_panel_2, tree_all_fields, grd_selected_fields])
        
        self.pnl_panel_2 = pnl_panel_2
        self.chk_distinct = chk_distinct
        self.cnt_limit = cnt_limit
        self.chk_limit = chk_limit
        self.nmbr_limit_count = nmbr_limit_count
        self.tree_all_fields = tree_all_fields
        self.clmn_fields_entities = clmn_fields_entities
        self.grd_selected_fields = grd_selected_fields
        self.jstore_select_entities = jstore_select_entities
        self.clmn_gridColumn_1 = clmn_gridColumn_1
        self.clmn_gridColumn_2 = clmn_gridColumn_2
        self.clmn_gridColumn_3 = clmn_gridColumn_3
        
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
        self.height = 300
        self.min_width = 400
        self.width = 400
        self.maximizable = False
        self.minimizable = False
        
        tb_toolbar_1 = ExtToolBar()
        tb_toolbar_1.layout = 'toolbar'
        
        select = ExtButton()
        select.text = u'Выбрать'
        
        cancel = ExtButton()
        cancel.text = u'Отмена'
        
        cnt_container_3 = ExtContainer()
        cnt_container_3.layout = 'hbox'
        cnt_container_3.region = 'center'
        cnt_container_3.height = 200
        cnt_container_3.layout_config = {'align': 'stretch'}
        
        tree_entities = ExtTree()
        tree_entities.flex = '1'
        tree_entities.layout = 'auto'
        tree_entities.root_text = 'Root'
        tree_entities.header = False
        
        scheme_1 = ExtGridColumn()
        scheme_1.header = u'Схема'
        scheme_1.data_index = 'scheme_1'
        scheme_1.menu_disabled = True
        
        tree_treepanel_2 = ExtTree()
        tree_treepanel_2.flex = '1'
        tree_treepanel_2.layout = 'auto'
        tree_treepanel_2.root_text = 'Root'
        tree_treepanel_2.header = False
        
        scheme_2 = ExtGridColumn()
        scheme_2.header = u'Схема'
        scheme_2.data_index = 'scheme_2'
        scheme_2.menu_disabled = True
        
        cnt_container_2 = ExtContainer()
        cnt_container_2.layout = 'hbox'
        cnt_container_2.region = 'south'
        cnt_container_2.height = 35
        cnt_container_2.style = {'padding': '5px'}
        
        chk_checkbox_1 = ExtCheckBox()
        chk_checkbox_1.flex = 1
        chk_checkbox_1.box_label = u'Внешняя связь'
        
        chk_checkbox_2 = ExtCheckBox()
        chk_checkbox_2.flex = 1
        chk_checkbox_2.box_label = u'Внешняя связь'
        
        self.footer_bar = tb_toolbar_1
        
        tb_toolbar_1.items.extend([select, cancel])
        tree_entities.columns.extend([scheme_1])
        tree_treepanel_2.columns.extend([scheme_2])
        cnt_container_3.items.extend([tree_entities, tree_treepanel_2])
        cnt_container_2.items.extend([chk_checkbox_1, chk_checkbox_2])
        self.items.extend([cnt_container_3, cnt_container_2])
        
        self.tb_toolbar_1 = tb_toolbar_1
        self.select = select
        self.cancel = cancel
        self.cnt_container_3 = cnt_container_3
        self.tree_entities = tree_entities
        self.scheme_1 = scheme_1
        self.tree_treepanel_2 = tree_treepanel_2
        self.scheme_2 = scheme_2
        self.cnt_container_2 = cnt_container_2
        self.chk_checkbox_1 = chk_checkbox_1
        self.chk_checkbox_2 = chk_checkbox_2

        