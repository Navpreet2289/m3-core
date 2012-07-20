Ext.namespace("Ext.ux.grid.livegrid");
Ext.ux.grid.livegrid.GridPanel=Ext.extend(Ext.grid.GridPanel,{initComponent:function(){if(this.cls)this.cls+=" ext-ux-livegrid";else this.cls="ext-ux-livegrid";Ext.ux.grid.livegrid.GridPanel.superclass.initComponent.call(this)},onRender:function(a,b){Ext.ux.grid.livegrid.GridPanel.superclass.onRender.call(this,a,b);var c=this.getStore();if(c._autoLoad===true){delete c._autoLoad;c.load()}},walkCells:function(a,b,c,d,e){var f=this.store,g=f.getCount;f.getCount=f.getTotalCount;a=Ext.ux.grid.livegrid.GridPanel.superclass.walkCells.call(this,
a,b,c,d,e);f.getCount=g;return a}});Ext.namespace("Ext.ux.grid.livegrid");
Ext.ux.grid.livegrid.GridView=function(a){this.addEvents({beforebuffer:true,buffer:true,bufferfailure:true,cursormove:true,abortrequest:true});this.horizontalScrollOffset=17;this._checkEmptyBody=true;Ext.apply(this,a);this.templates={};this.templates.master=new Ext.Template('<div class="x-grid3" hidefocus="true"><div class="liveScroller"><div></div><div></div><div></div></div>','<div class="x-grid3-viewport"">','<div class="x-grid3-header"><div class="x-grid3-header-inner"><div class="x-grid3-header-offset" style="{ostyle}">{header}</div></div><div class="x-clear"></div></div>','<div class="x-grid3-scroller" style="overflow-y:hidden !important;"><div class="x-grid3-body" style="{bstyle}">{body}</div><a href="#" class="x-grid3-focus" tabIndex="-1"></a></div>',
"</div>",'<div class="x-grid3-resize-marker">&#160;</div>','<div class="x-grid3-resize-proxy">&#160;</div>',"</div>");this._gridViewSuperclass=Ext.ux.grid.livegrid.GridView.superclass;this._gridViewSuperclass.constructor.call(this)};
Ext.extend(Ext.ux.grid.livegrid.GridView,Ext.grid.GridView,{hdHeight:0,rowClipped:0,liveScroller:null,liveScrollerInsets:null,rowHeight:-1,visibleRows:1,lastIndex:-1,lastRowIndex:0,lastScrollPos:0,rowIndex:0,isBuffering:false,requestQueue:-1,loadMask:false,loadMaskDisplayed:false,isPrebuffering:false,_loadMaskAnchor:null,reset:function(a){if(a===false){this.ds.modified=[];this.lastIndex=this.lastRowIndex=this.lastScrollPos=this.rowIndex=0;this.adjustVisibleRows();this.adjustScrollerPos(-this.liveScroller.dom.scrollTop,
true);this.showLoadMask(false);a=this.processRows;this.processRows=Ext.emptyFn;this.refresh(true);this.processRows=a;this.processRows(0);this.fireEvent("cursormove",this,0,Math.min(this.ds.totalLength,this.visibleRows-this.rowClipped),this.ds.totalLength);return false}else{a={};var b=this.ds.sortInfo;if(b)a={dir:b.direction,sort:b.field};return this.ds.load({params:a})}},renderUI:function(){var a=this.grid,b=a.enableDragDrop||a.enableDrag;a.enableDragDrop=false;a.enableDrag=false;var c=this._gridViewSuperclass.renderUI.call(this);
a=this.grid;a.enableDragDrop=b;if(a.enableDrag=b)this.dragZone=new Ext.ux.grid.livegrid.DragZone(a,{ddGroup:a.ddGroup||"GridDD"});return c},afterRenderUI:function(){this._gridViewSuperclass.afterRenderUI.call(this);if(this.loadMask){this._loadMaskAnchor=Ext.get(this.mainBody.dom.parentNode.parentNode);Ext.apply(this.loadMask,{msgCls:"x-mask-loading"});this._loadMaskAnchor.mask(this.loadMask.msg,this.loadMask.msgCls);var a=this._loadMaskAnchor.dom,b=Ext.Element.data;b(a,"mask").addClass("ext-ux-livegrid");
b(a,"mask").setDisplayed(false);b(a,"maskMsg").setDisplayed(false)}},init:function(a){this._gridViewSuperclass.init.call(this,a);a.on("expand",this._onExpand,this)},initData:function(a,b){if(this.ds){this.ds.un("bulkremove",this.onBulkRemove,this);this.ds.un("beforeload",this.onBeforeLoad,this)}if(a){a.on("bulkremove",this.onBulkRemove,this);a.on("beforeload",this.onBeforeLoad,this)}this._gridViewSuperclass.initData.call(this,a,b)},renderBody:function(){return this.templates.body.apply({rows:this.renderRows(0,
this.visibleRows-1)})},doRender:function(a,b,c,d,e,f){return this._gridViewSuperclass.doRender.call(this,a,b,c,d+this.ds.bufferRange[0],e,f)},initElements:function(){var a=Ext.Element,b=this.grid.getGridEl().dom.firstChild,c=b.childNodes;this.el=new a(b);this.mainWrap=new a(c[1]);this.liveScroller=new a(c[0]);b=this.liveScroller.dom.firstChild;this.liveScrollerInsets=[b,b.nextSibling,b.nextSibling.nextSibling];this.liveScroller.on("scroll",this.onLiveScroll,this,{buffer:this.scrollDelay});this.mainHd=
new a(this.mainWrap.dom.firstChild);this.innerHd=this.mainHd.dom.firstChild;this.scroller=new a(this.mainWrap.dom.childNodes[1]);this.forceFit&&this.scroller.setStyle("overflow-x","hidden");this.mainBody=new a(this.scroller.dom.firstChild);this.mainBody.on("mousewheel",this.handleWheel,this);this.focusEl=new a(this.scroller.dom.childNodes[1]);this.focusEl.swallowEvent("click",true);this.resizeMarker=new a(c[2]);this.resizeProxy=new a(c[3])},layout:function(){if(this.mainBody){var a=this.grid,b=a.getGridEl().getSize(true),
c=b.width;if(!(!a.hideHeaders&&c<20||b.height<20)){if(a.autoHeight){this.scroller.dom.style.overflow="visible";if(Ext.isWebKit)this.scroller.dom.style.position="static"}else{if(this.grid.groupingToolBar!=undefined)b.height-=this.grid.groupingToolBar.getHeight();else b.height=b.height;this.el.setSize(b.width,b.height);a=this.mainHd.getHeight();var d=b.height-a;this.scroller.setSize(c,d);if(this.innerHd)this.innerHd.style.width=c+"px"}this.liveScroller.dom.style.top=this.mainHd.getHeight()+"px";if(this.forceFit){if(this.lastViewWidth!=
c){this.fitColumns(false,false);this.lastViewWidth=c}}else this.autoExpand();this.onLayout(c,d);this.adjustVisibleRows();this.adjustBufferInset()}}},removeRow:function(a){Ext.removeNode(this.getRow(a))},removeRows:function(a,b){for(var c=this.mainBody.dom,d=a;d<=b;d++)Ext.removeNode(c.childNodes[a])},_onExpand:function(){this.adjustVisibleRows();this.adjustBufferInset();this.adjustScrollerPos(this.rowHeight*this.rowIndex,true)},onColumnMove:function(a,b,c){this.indexMap=null;this.replaceLiveRows(this.rowIndex,
true);this.updateHeaders();this.updateHeaderSortState();this.afterMove(c);this.grid.fireEvent("columnmove",b,c)},onColumnWidthUpdated:function(){this.adjustVisibleRows();this.adjustBufferInset()},onAllColumnWidthsUpdated:function(){this.adjustVisibleRows();this.adjustBufferInset()},onRowSelect:function(a){a<this.rowIndex||a>this.rowIndex+this.visibleRows||this.addRowClass(a,this.selectedRowClass)},onRowDeselect:function(a){a<this.rowIndex||a>this.rowIndex+this.visibleRows||this.removeRowClass(a,this.selectedRowClass)},
onClear:function(){this.reset(false)},onBulkRemove:function(a,b){var c=null,d=0;d=0;var e=b.length;if(e!=0){for(var f=0,g=0,i=0,h=0;h<e;h++){c=b[h][0];d=b[h][1];d=d!=Number.MIN_VALUE&&d!=Number.MAX_VALUE?d+this.ds.bufferRange[0]:d;if(d<this.rowIndex)f++;else if(d>=this.rowIndex&&d<=this.rowIndex+(this.visibleRows-1))i++;else d>=this.rowIndex+this.visibleRows&&g++;this.fireEvent("beforerowremoved",this,d,c);this.fireEvent("rowremoved",this,d,c)}this.lastRowIndex=this.rowIndex=Math.max(0,Math.min(this.rowIndex-
f,this.ds.totalLength-(this.visibleRows-1)));this.adjustScrollerPos(-(f*this.rowHeight),true);this.updateLiveRows(this.rowIndex,true);this.adjustBufferInset();this.processRows(0,undefined,false)}},onRemove:function(a,b,c){this.onBulkRemove(a,[[b,c]])},onAdd:function(a,b,c){if(this._checkEmptyBody){if(this.mainBody.dom.innerHTML=="&nbsp;")this.mainBody.dom.innerHTML="";this._checkEmptyBody=false}b=b.length;if(c==Number.MAX_VALUE||c==Number.MIN_VALUE){this.fireEvent("beforerowsinserted",this,c,c);if(c==
Number.MIN_VALUE){this.rowIndex+=b;this.lastRowIndex=this.rowIndex;this.adjustBufferInset();this.adjustScrollerPos(this.rowHeight*b,true);this.fireEvent("rowsinserted",this,c,c,b);this.processRows(0,undefined,false);this.fireEvent("cursormove",this,this.rowIndex,Math.min(this.ds.totalLength,this.visibleRows-this.rowClipped),this.ds.totalLength)}else{this.adjustBufferInset();this.fireEvent("rowsinserted",this,c,c,b)}}else{var d=c+this.ds.bufferRange[0],e=d+(b-1);this.getRows();var f=0,g=0;if(d>this.rowIndex+
(this.visibleRows-1)){this.fireEvent("beforerowsinserted",this,d,e);this.fireEvent("rowsinserted",this,d,e,b);this.adjustVisibleRows();this.adjustBufferInset()}else if(d>=this.rowIndex&&d<=this.rowIndex+(this.visibleRows-1)){f=c;g=c+(b-1);this.lastRowIndex=this.rowIndex;this.rowIndex=d>this.rowIndex?this.rowIndex:d;this.insertRows(a,f,g);this.lastRowIndex!=this.rowIndex&&this.fireEvent("cursormove",this,this.rowIndex,Math.min(this.ds.totalLength,this.visibleRows-this.rowClipped),this.ds.totalLength);
this.adjustVisibleRows();this.adjustBufferInset()}else if(d<this.rowIndex){this.fireEvent("beforerowsinserted",this,d,e);this.rowIndex+=b;this.lastRowIndex=this.rowIndex;this.adjustVisibleRows();this.adjustBufferInset();this.adjustScrollerPos(this.rowHeight*b,true);this.fireEvent("rowsinserted",this,d,e,b);this.processRows(0,undefined,true);this.fireEvent("cursormove",this,this.rowIndex,Math.min(this.ds.totalLength,this.visibleRows-this.rowClipped),this.ds.totalLength)}}},onBeforeLoad:function(a,
b){var c=a.proxy;c.activeRequest&&c.activeRequest[Ext.data.Api.actions.read]&&c.getConnection().abort(c.activeRequest[Ext.data.Api.actions.read]);this.fireEvent("abortrequest",a,b);this.isPreBuffering=this.isBuffering=false;b.params=b.params||{};c=Ext.apply;c(b,{scope:this,callback:function(){this.reset(false)},suspendLoadEvent:false});c(b.params,{start:0,limit:this.ds.bufferSize});return true},onLoad:function(){this.adjustBufferInset()},onDataChange:function(){this.updateHeaderSortState()},liveBufferUpdate:function(a,
b,c){if(c===true){this.adjustBufferInset();this.fireEvent("buffer",this,this.ds,this.rowIndex,Math.min(this.ds.totalLength,this.visibleRows-this.rowClipped),this.ds.totalLength,b);this.grid.selModel.replaceSelections(a);this.isPrebuffering=this.isBuffering=false;this.showLoadMask(false);if(this.requestQueue>=0){a=this.requestQueue;this.requestQueue=-1;this.updateLiveRows(a)}else this.isInRange(this.rowIndex)?this.replaceLiveRows(this.rowIndex,b.forceRepaint):this.updateLiveRows(this.rowIndex)}else{this.fireEvent("bufferfailure",
this,this.ds,b);this.requestQueue=-1;this.isPrebuffering=this.isBuffering=false;this.showLoadMask(false)}},handleWheel:function(a){this.rowHeight!=-1&&this.adjustScrollerPos(-(a.getWheelDelta()*this.rowHeight));a.stopEvent()},onLiveScroll:function(){var a=Math.floor(this.liveScroller.dom.scrollTop/this.rowHeight);this.rowIndex=a;if(a!=this.lastRowIndex){this.updateLiveRows(a);this.lastScrollPos=this.liveScroller.dom.scrollTop}},refreshRow:function(a){var b=this.ds,c;if(typeof a=="number"){c=a;a=b.getAt(c)}else c=
b.indexOf(a);var d=c+this.ds.bufferRange[0];d<this.rowIndex||d>=this.rowIndex+this.visibleRows||this.insertRows(b,c,c,true);this.fireEvent("rowupdated",this,d,a)},processRows:function(a,b,c){if(!(!this.ds||this.ds.getCount()<1)){b=b||!this.grid.stripeRows;a=this.rowIndex;for(var d=this.getRows(),e=0,f=null,g=0,i=d.length;g<i;g++){f=d[g];f.rowIndex=e=a+g;f.className=f.className.replace(this.rowClsRe," ");if(!b&&(e+1)%2===0)f.className+=" x-grid3-row-alt";if(c!==false){this.grid.selModel.isSelected(this.ds.getAt(e))===
true?this.addRowClass(e,this.selectedRowClass):this.removeRowClass(e,this.selectedRowClass);this.fly(f).removeClass("x-grid3-row-over")}}if(a===0)Ext.fly(d[0]).addClass(this.firstRowCls);else a+d.length==this.ds.totalLength&&Ext.fly(d[d.length-1]).addClass(this.lastRowCls)}},insertRows:function(a,b,c,d){a=b+this.ds.bufferRange[0];var e=c+this.ds.bufferRange[0];d||this.fireEvent("beforerowsinserted",this,a,e);if(d!==true&&this.getRows().length+(c-b)>=this.visibleRows)this.removeRows(this.visibleRows-
1-(c-b),this.visibleRows-1);else d&&this.removeRows(a-this.rowIndex,e-this.rowIndex);b=this.renderRows(b,b==c?c:Math.min(c,this.rowIndex-this.ds.bufferRange[0]+(this.visibleRows-1)));(c=this.getRow(a))?Ext.DomHelper.insertHtml("beforeBegin",c,b):Ext.DomHelper.insertHtml("beforeEnd",this.mainBody.dom,b);if(d===true){b=this.getRows();c=this.rowIndex;for(var f=0,g=b.length;f<g;f++)b[f].rowIndex=c+f}if(!d){this.fireEvent("rowsinserted",this,a,e,e-a+1);this.processRows(0,undefined,true)}},getRow:function(a){if(a-
this.rowIndex<0)return null;return this.getRows()[a-this.rowIndex]},getCell:function(a,b){return(a=this.getRow(a))?a.getElementsByTagName("td")[b]:null},focusCell:function(a,b,c){if(a=this.ensureVisible(a,b,c)){this.focusEl.setXY(a);Ext.isGecko?this.focusEl.focus():this.focusEl.focus.defer(1,this.focusEl)}},ensureVisible:function(a,b,c){if(typeof a!="number")a=a.rowIndex;if(!(a<0||a>=this.ds.totalLength)){b=b!==undefined?b:0;var d=a-this.rowIndex;if(this.rowClipped&&a==this.rowIndex+this.visibleRows-
1)this.adjustScrollerPos(this.rowHeight);else if(a>=this.rowIndex+this.visibleRows)this.adjustScrollerPos((a-(this.rowIndex+this.visibleRows)+1)*this.rowHeight);else a<=this.rowIndex&&this.adjustScrollerPos(d*this.rowHeight);d=this.getRow(a);var e;if(d){if(!(c===false&&b===0)){for(;this.cm.isHidden(b);)b++;e=this.getCell(a,b)}a=this.scroller.dom;if(c!==false){c=parseInt(e.offsetLeft,10);b=c+e.offsetWidth;var f=parseInt(a.scrollLeft,10),g=f+a.clientWidth;if(c<f)a.scrollLeft=c;else if(b>g)a.scrollLeft=
b-a.clientWidth}return e?Ext.fly(e).getXY():[a.scrollLeft+this.el.getX(),Ext.fly(d).getY()]}}},isRecordRendered:function(a){a=this.ds.indexOf(a);if(a>=this.rowIndex&&a<this.rowIndex+this.visibleRows)return true;return false},isInRange:function(a){var b=Math.min(this.ds.totalLength-1,a+(this.visibleRows-1));return a>=this.ds.bufferRange[0]&&b<=this.ds.bufferRange[1]},getPredictedBufferIndex:function(a,b,c){if(!b){if(a+this.ds.bufferSize>=this.ds.totalLength)return this.ds.totalLength-this.ds.bufferSize;
if(Math.round(this.ds.bufferSize/2)<this.visibleRows){Ext.Msg.show({title:"\u0412\u043d\u0438\u043c\u0430\u043d\u0438\u0435",msg:"\u0414\u043b\u044f \u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u043e\u0439 \u0440\u0430\u0431\u043e\u0442\u044b \u043d\u0435\u043e\u0431\u0445\u043e\u0434\u0438\u043c\u043e \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0440\u0430\u0437\u043c\u0435\u0440 \u0431\u0443\u0444\u0435\u0440\u0430",buttons:Ext.Msg.OK});throw Error("\u0423\u0432\u0435\u043b\u0438\u0447\u044c\u0442\u0435 \u0440\u0430\u0437\u043c\u0435\u0440 \u0431\u0443\u0444\u0435\u0440\u0430");
}return Math.max(0,a+this.visibleRows-Math.round(this.ds.bufferSize/2))}if(!c)return Math.max(0,a-this.ds.bufferSize+this.visibleRows);if(c)return Math.max(0,Math.min(a,this.ds.totalLength-this.ds.bufferSize))},updateLiveRows:function(a,b,c){var d=this.isInRange(a);if(this.isBuffering){if(this.isPrebuffering)d?this.replaceLiveRows(a,b):this.showLoadMask(true);this.fireEvent("cursormove",this,a,Math.min(this.ds.totalLength,this.visibleRows-this.rowClipped),this.ds.totalLength);this.requestQueue=a}else{var e=
this.lastIndex;this.lastIndex=a;d=this.isInRange(a);var f=false;if(d&&c!==true){this.replaceLiveRows(a,b);this.fireEvent("cursormove",this,a,Math.min(this.ds.totalLength,this.visibleRows-this.rowClipped),this.ds.totalLength);if(a>e){f=true;if(a+this.visibleRows+this.nearLimit<=this.ds.bufferRange[1])return;if(this.ds.bufferRange[1]+1>=this.ds.totalLength)return}else if(a<e){f=false;if(this.ds.bufferRange[0]<=0)return;if(a-this.nearLimit>this.ds.bufferRange[0])return}else return;this.isPrebuffering=
true}this.isBuffering=true;c=this.getPredictedBufferIndex(a,d,f);d||this.showLoadMask(true);this.ds.suspendEvents();d=this.ds.sortInfo;e={};this.ds.lastOptions&&Ext.apply(e,this.ds.lastOptions.params);e.start=c;e.limit=this.ds.bufferSize;if(d){e.dir=d.direction;e.sort=d.field}b={forceRepaint:b,callback:this.liveBufferUpdate,scope:this,params:e,suspendLoadEvent:true};this.fireEvent("beforebuffer",this,this.ds,a,Math.min(this.ds.totalLength,this.visibleRows-this.rowClipped),this.ds.totalLength,b);this.ds.load(b);
this.ds.resumeEvents()}},showLoadMask:function(a){if(!(!this.loadMask||a==this.loadMaskDisplayed)){var b=this._loadMaskAnchor.dom,c=Ext.Element.data,d=c(b,"mask");b=c(b,"maskMsg");if(a){d.setDisplayed(true);b.setDisplayed(true);b.center(this._loadMaskAnchor);Ext.isIE&&!(Ext.isIE7&&Ext.isStrict)&&this._loadMaskAnchor.getStyle("height")=="auto"&&d.setSize(undefined,this._loadMaskAnchor.getHeight())}else{d.setDisplayed(false);b.setDisplayed(false)}this.loadMaskDisplayed=a}},replaceLiveRows:function(a,
b,c){var d=a-this.lastRowIndex;if(!(d==0&&b!==true)){b=d>0;d=Math.abs(d);var e=this.ds.bufferRange,f=a-e[0],g=Math.min(f+this.visibleRows-1,e[1]-e[0]);if(d>=this.visibleRows||d==0)this.mainBody.update(this.renderRows(f,g));else if(b){this.removeRows(0,d-1);if(f+this.visibleRows-d<=e[1]-e[0]){d=this.renderRows(f+this.visibleRows-d,g);Ext.DomHelper.insertHtml("beforeEnd",this.mainBody.dom,d)}}else{this.removeRows(this.visibleRows-d,this.visibleRows-1);d=this.renderRows(f,f+d-1);Ext.DomHelper.insertHtml("beforeBegin",
this.mainBody.dom.firstChild,d)}c!==false&&this.processRows(0,undefined,true);this.lastRowIndex=a}},adjustBufferInset:function(){var a=this.liveScroller.dom,b=this.grid,c=b.store;b=b.getGridEl().getSize().width;c=c.totalLength==this.visibleRows-this.rowClipped?0:Math.max(0,c.totalLength-(this.visibleRows-this.rowClipped));if(c==0){this.scroller.setWidth(b);a.style.display="none"}else{this.scroller.setWidth(b-this.getScrollOffset());a.style.display="";this.cm.getTotalWidth();this.getScrollOffset();
contHeight=this.scroller.getHeight();a.style.height=Math.max(contHeight,this.horizontalScrollOffset*2)+"px";if(this.rowHeight!=-1){c=a=c==0?0:contHeight+c*this.rowHeight;b=this.liveScrollerInsets.length;a=a==0?0:Math.round(a/b);for(var d=0;d<b;d++){if(d==b-1&&a!=0)a-=a*3-c;this.liveScrollerInsets[d].style.height=a+"px"}}}},adjustVisibleRows:function(){if(this.rowHeight==-1)if(this.getRows()[0]){this.rowHeight=this.getRows()[0].offsetHeight;if(this.rowHeight<=0){this.rowHeight=-1;return}}else return;
var a=this.grid,b=a.store;a.getGridEl().getSize();vh=this.scroller.getHeight();a=b.totalLength||0;b=Math.max(1,Math.floor(vh/this.rowHeight));this.rowClipped=0;if(a>b&&this.rowHeight/3<vh-b*this.rowHeight){b=Math.min(b+1,a);this.rowClipped=1}if(this.visibleRows!=b){this.visibleRows=b;if(!(this.isBuffering&&!this.isPrebuffering)){if(this.rowIndex+(b-this.rowClipped)>a)this.lastRowIndex=this.rowIndex=Math.max(0,a-(b-this.rowClipped));this.updateLiveRows(this.rowIndex,true)}}},adjustScrollerPos:function(a,
b){if(a!=0){var c=this.liveScroller,d=c.dom;b===true&&c.un("scroll",this.onLiveScroll,this);this.lastScrollPos=d.scrollTop;d.scrollTop+=a;if(b===true){d.scrollTop=d.scrollTop;c.on("scroll",this.onLiveScroll,this,{buffer:this.scrollDelay})}}}});Ext.namespace("Ext.ux.grid.livegrid");Ext.ux.grid.livegrid.JsonReader=function(a,b){Ext.ux.grid.livegrid.JsonReader.superclass.constructor.call(this,a,b)};
Ext.extend(Ext.ux.grid.livegrid.JsonReader,Ext.data.JsonReader,{buildExtractors:function(){if(!this.ef){var a=this.meta;if(a.versionProperty)this.getVersion=this.createAccessor(a.versionProperty);Ext.ux.grid.livegrid.JsonReader.superclass.buildExtractors.call(this)}},readRecords:function(a){if(!this.__readRecords)this.__readRecords=Ext.ux.grid.livegrid.JsonReader.superclass.readRecords;var b=this.__readRecords.call(this,a);if(this.meta.versionProperty){a=this.getVersion(a);b.version=a===undefined||
a===""?null:a}return b}});Ext.namespace("Ext.ux.grid.livegrid");Ext.ux.grid.livegrid.RowSelectionModel=function(a){this.addEvents({selectiondirty:true});Ext.apply(this,a);this.pendingSelections={};Ext.ux.grid.livegrid.RowSelectionModel.superclass.constructor.call(this)};
Ext.extend(Ext.ux.grid.livegrid.RowSelectionModel,Ext.grid.RowSelectionModel,{initEvents:function(){Ext.ux.grid.livegrid.RowSelectionModel.superclass.initEvents.call(this);this.grid.view.on("rowsinserted",this.onAdd,this);this.grid.store.on("selectionsload",this.onSelectionsLoad,this)},onRemove:function(a,b,c){a=this.getPendingSelections();var d=a.length,e=false;if(b==Number.MIN_VALUE||b==Number.MAX_VALUE){if(c){this.isIdSelected(c.id)&&b==Number.MIN_VALUE&&this.shiftSelections(this.grid.store.bufferRange[1],
-1);this.selections.remove(c);e=true}b==Number.MIN_VALUE?this.clearPendingSelections(0,this.grid.store.bufferRange[0]):this.clearPendingSelections(this.grid.store.bufferRange[1]);d!=0&&this.fireEvent("selectiondirty",this,b,1)}else{e=this.isIdSelected(c.id);if(!e)return;this.selections.remove(c);if(d!=0){c=a[0];if(b<=a[d-1]||b<=c){this.shiftSelections(b,-1);this.fireEvent("selectiondirty",this,b,1)}}}e&&this.fireEvent("selectionchange",this)},onAdd:function(a,b,c,d){a=this.getPendingSelections();
c=a.length;if(b==Number.MIN_VALUE||b==Number.MAX_VALUE){if(b==Number.MIN_VALUE){this.clearPendingSelections(0,this.grid.store.bufferRange[0]);this.shiftSelections(this.grid.store.bufferRange[1],d)}else this.clearPendingSelections(this.grid.store.bufferRange[1]);c!=0&&this.fireEvent("selectiondirty",this,b,r)}else{var e=a[0];if(b<=a[c-1]||b<=e){this.fireEvent("selectiondirty",this,b,d);this.shiftSelections(b,d)}}},shiftSelections:function(a,b){var c=0;c=0;var d={},e=this.grid.store,f=a-e.bufferRange[0],
g=0,i=this.grid.store.totalLength;g=null;var h=this.getPendingSelections(),k=h.length;if(k!=0){for(var j=0;j<k;j++){c=h[j];if(!(c<a)){c=c+b;g=f+b;if(c>=i)break;if(g=e.getAt(g))this.selections.add(g);else d[c]=true}}this.pendingSelections=d}},onSelectionsLoad:function(a,b){this.replaceSelections(b)},hasNext:function(){return this.last!==false&&this.last+1<this.grid.store.getTotalCount()},getCount:function(){return this.selections.length+this.getPendingSelections().length},isSelected:function(a){if(typeof a==
"number"){var b=a;a=this.grid.store.getAt(b);if(!a){if(this.getPendingSelections().indexOf(b)!=-1)return true;return false}}return(a=a)&&this.selections.key(a.id)?true:false},deselectRecord:function(a,b){if(!this.locked)if(this.selections.key(a.id)){var c=this.grid.store,d=c.indexOfId(a.id);if(d==-1){d=c.findInsertIndex(a);if(d!=Number.MIN_VALUE&&d!=Number.MAX_VALUE)d+=c.bufferRange[0]}else delete this.pendingSelections[d];if(this.last==d)this.last=false;if(this.lastActive==d)this.lastActive=false;
this.selections.remove(a);b||this.grid.getView().onRowDeselect(d);this.fireEvent("rowdeselect",this,d,a);this.fireEvent("selectionchange",this)}},deselectRow:function(a,b){if(!this.locked){if(this.last==a)this.last=false;if(this.lastActive==a)this.lastActive=false;var c=this.grid.store.getAt(a);delete this.pendingSelections[a];c&&this.selections.remove(c);b||this.grid.getView().onRowDeselect(a);this.fireEvent("rowdeselect",this,a,c);this.fireEvent("selectionchange",this)}},selectRow:function(a,b,
c){if(!(this.locked||a<0||a>=this.grid.store.getTotalCount())){var d=this.grid.store.getAt(a);if(this.fireEvent("beforerowselect",this,a,b,d)!==false){if(!b||this.singleSelect)this.clearSelections();if(d){this.selections.add(d);delete this.pendingSelections[a]}else this.pendingSelections[a]=true;this.last=this.lastActive=a;c||this.grid.getView().onRowSelect(a);this.fireEvent("rowselect",this,a,d);this.fireEvent("selectionchange",this)}}},clearPendingSelections:function(a,b){if(b==undefined)b=Number.MAX_VALUE;
for(var c={},d=this.getPendingSelections(),e=d.length,f=0,g=0;g<e;g++){f=d[g];f<=b&&f>=a||(c[f]=true)}this.pendingSelections=c},replaceSelections:function(a){if(!(!a||a.length==0)){for(var b=this.grid.store,c=null,d=[],e=this.getPendingSelections(),f=e.length,g=this.selections,i=0,h=0;h<f;h++){i=e[h];if(c=b.getAt(i)){g.add(c);d.push(c.id);delete this.pendingSelections[i]}}b=null;h=0;for(len=a.length;h<len;h++){c=a[h];b=c.id;d.indexOf(b)==-1&&g.containsKey(b)&&g.add(c)}}},getPendingSelections:function(a){var b=
[],c=0,d=[],e;for(e in this.pendingSelections)d.push(parseInt(e));d.sort(function(f,g){return f>g?1:f<g?-1:0});if(!a)return d;a=d.length;if(a==0)return[];b[c]=[d[0],d[0]];e=0;for(a-=1;e<a;e++)if(d[e+1]-d[e]==1)b[c][1]=d[e+1];else{c++;b[c]=[d[e+1],d[e+1]]}return b},clearSelections:function(a){if(!this.locked){if(a!==true){var b=this.grid.store;a=this.selections;var c=-1;a.each(function(d){c=b.indexOfId(d.id);c!=-1&&this.deselectRow(c+b.bufferRange[0])},this);a.clear()}else this.selections.clear();
this.pendingSelections={};this.last=false}},selectRange:function(a,b,c){if(!this.locked){c||this.clearSelections();if(a<=b)for(a=a;a<=b;a++)this.selectRow(a,true);else for(a=a;a>=b;a--)this.selectRow(a,true)}}});Ext.namespace("Ext.ux.grid.livegrid");
Ext.ux.grid.livegrid.Store=function(a){a=a||{};a.remoteSort=true;this._autoLoad=a.autoLoad?true:false;a.autoLoad=false;this.addEvents("bulkremove","versionchange","beforeselectionsload","selectionsload");Ext.ux.grid.livegrid.Store.superclass.constructor.call(this,a);this.totalLength=0;this.bufferRange=[-1,-1];this.on("clear",function(){this.bufferRange=[-1,-1]},this);if(this.url&&!this.selectionsProxy)this.selectionsProxy=new Ext.data.HttpProxy({url:this.url})};
Ext.extend(Ext.ux.grid.livegrid.Store,Ext.data.Store,{version:null,insert:function(a,b){b=[].concat(b);a=a>=this.bufferSize?Number.MAX_VALUE:a;if(a==Number.MIN_VALUE||a==Number.MAX_VALUE){var c=b.length;if(a==Number.MIN_VALUE){this.bufferRange[0]+=c;this.bufferRange[1]+=c}this.totalLength+=c;this.fireEvent("add",this,b,a)}else{c=false;var d=b;if(b.length+a>=this.bufferSize){c=true;d=b.splice(0,this.bufferSize-a)}this.totalLength+=d.length;if(this.bufferRange[0]<=-1)this.bufferRange[0]=0;if(this.bufferRange[1]<
this.bufferSize-1)this.bufferRange[1]=Math.min(this.bufferRange[1]+d.length,this.bufferSize-1);for(var e=0,f=d.length;e<f;e++){this.data.insert(a,d[e]);d[e].join(this)}for(;this.getCount()>this.bufferSize;)this.data.remove(this.data.last());this.fireEvent("add",this,d,a);c==true&&this.fireEvent("add",this,b,Number.MAX_VALUE)}},remove:function(a,b){var c=this._getIndex(a);if(c<0){this.totalLength-=1;this.pruneModifiedRecords&&this.modified.remove(a);this.bufferRange[0]=Math.max(-1,this.bufferRange[0]-
1);this.bufferRange[1]=Math.max(-1,this.bufferRange[1]-1);b!==true&&this.fireEvent("remove",this,a,c);return c}this.bufferRange[1]=Math.max(-1,this.bufferRange[1]-1);this.data.removeAt(c);this.pruneModifiedRecords&&this.modified.remove(a);this.totalLength-=1;b!==true&&this.fireEvent("remove",this,a,c);return c},_getIndex:function(a){var b=this.indexOfId(a.id);if(b<0)b=this.findInsertIndex(a);return b},bulkRemove:function(a){for(var b=null,c=[],d=a.length,e=[],f=0;f<d;f++){b=a[f];e[b.id]=this._getIndex(b)}for(f=
0;f<d;f++){b=a[f];this.remove(b,true);c.push([b,e[b.id]])}this.fireEvent("bulkremove",this,c)},removeAll:function(){this.totalLength=0;this.bufferRange=[-1,-1];this.data.clear();if(this.pruneModifiedRecords)this.modified=[];this.fireEvent("clear",this)},loadRanges:function(a){if(a.length>0&&!this.selectionsProxy.activeRequest[Ext.data.Api.actions.read]&&this.fireEvent("beforeselectionsload",this,a)!==false){var b=this.lastOptions.params,c={};c.ranges=Ext.encode(a);if(b){if(b.sort)c.sort=b.sort;if(b.dir)c.dir=
b.dir}a={};for(var d in this.lastOptions)a.i=this.lastOptions.i;a.ranges=c.ranges;this.selectionsProxy.doRequest(Ext.data.Api.actions.read,null,a,this.reader,this.selectionsLoaded,this,a)}},loadSelections:function(a){a.length!=0&&this.loadRanges(a)},selectionsLoaded:function(a,b,c){if(this.checkVersionChange(a,b,c)!==false){c=a.records;for(var d=0,e=c.length;d<e;d++)c[d].join(this);this.fireEvent("selectionsload",this,a.records,Ext.decode(b.ranges))}else this.fireEvent("selectionsload",this,[],Ext.decode(b.ranges))},
checkVersionChange:function(a,b,c){if(a&&c!==false)if(a.version!==undefined){b=this.version;this.version=a.version;if(this.version!==b)return this.fireEvent("versionchange",this,b,this.version)}},findInsertIndex:function(a){this.remoteSort=false;a=Ext.ux.grid.livegrid.Store.superclass.findInsertIndex.call(this,a);this.remoteSort=true;if(this.bufferRange[0]<=0&&a==0)return a;else if(this.bufferRange[0]>0&&a==0)return Number.MIN_VALUE;else if(a>=this.bufferSize)return Number.MAX_VALUE;return a},sortData:function(a,
b){b=b||"ASC";var c=this.fields.get(a).sortType;this.data.sort(b,function(d,e){var f=c(d.data[a]),g=c(e.data[a]);return f>g?1:f<g?-1:0})},onMetaChange:function(a,b,c){this.version=null;Ext.ux.grid.livegrid.Store.superclass.onMetaChange.call(this,a,b,c)},loadRecords:function(a,b,c){this.checkVersionChange(a,b,c);this.bufferRange=a?[b.params.start,Math.max(0,Math.min(b.params.start+b.params.limit-1,a.totalRecords-1))]:[-1,-1];b.suspendLoadEvent===true&&this.suspendEvents();Ext.ux.grid.livegrid.Store.superclass.loadRecords.call(this,
a,b,c);b.suspendLoadEvent===true&&this.resumeEvents()},getAt:function(a){if(this.bufferRange[0]!=-1)return this.data.itemAt(a-this.bufferRange[0])},clearFilter:function(){},isFiltered:function(){},collect:function(){},createFilterFn:function(){},sum:function(){},filter:function(){},filterBy:function(){},query:function(){},queryBy:function(){},find:function(){},findBy:function(){}});Ext.namespace("Ext.ux.grid.livegrid");
Ext.ux.grid.livegrid.Toolbar=Ext.extend(Ext.Toolbar,{displayMsg:"Displaying {0} - {1} of {2}",emptyMsg:"No data to display",refreshText:"Refresh",initComponent:function(){Ext.ux.grid.livegrid.Toolbar.superclass.initComponent.call(this);if(this.grid)this.view=this.grid.getView();var a=this;this.view.init=this.view.init.createSequence(function(){a.bind(this)},this.view)},updateInfo:function(a,b,c){if(this.displayEl)this.displayEl.update(c==0?this.emptyMsg:String.format(this.displayMsg,a+1,a+b,c))},
unbind:function(a){var b;b=a instanceof Ext.grid.GridView?a:a.getView();a=a.ds;a.un("loadexception",this.enableLoading,this);a.un("beforeload",this.disableLoading,this);a.un("load",this.enableLoading,this);b.un("rowremoved",this.onRowRemoved,this);b.un("rowsinserted",this.onRowsInserted,this);b.un("beforebuffer",this.beforeBuffer,this);b.un("cursormove",this.onCursorMove,this);b.un("buffer",this.onBuffer,this);b.un("bufferfailure",this.enableLoading,this);this.view=undefined},bind:function(a){this.view=
a;var b=a.ds;b.on("loadexception",this.enableLoading,this);b.on("beforeload",this.disableLoading,this);b.on("load",this.enableLoading,this);a.on("rowremoved",this.onRowRemoved,this);a.on("rowsinserted",this.onRowsInserted,this);a.on("beforebuffer",this.beforeBuffer,this);a.on("cursormove",this.onCursorMove,this);a.on("buffer",this.onBuffer,this);a.on("bufferfailure",this.enableLoading,this)},enableLoading:function(){this.loading.setDisabled(false)},disableLoading:function(){this.loading.setDisabled(true)},
onCursorMove:function(a,b,c,d){this.updateInfo(b,c,d)},onRowsInserted:function(a){this.updateInfo(a.rowIndex,Math.min(a.ds.totalLength,a.visibleRows-a.rowClipped),a.ds.totalLength)},onRowRemoved:function(a){this.updateInfo(a.rowIndex,Math.min(a.ds.totalLength,a.visibleRows-a.rowClipped),a.ds.totalLength)},beforeBuffer:function(a,b,c,d,e){this.loading.disable();this.updateInfo(c,d,e)},onBuffer:function(a,b,c,d,e){this.loading.enable();this.updateInfo(c,d,e)},onClick:function(a){switch(a){case "refresh":this.view.reset(true)?
this.loading.disable():this.loading.enable()}},onRender:function(a,b){Ext.PagingToolbar.superclass.onRender.call(this,a,b);this.loading=new Ext.Toolbar.Button({tooltip:this.refreshText,iconCls:"x-tbar-loading",handler:this.onClick.createDelegate(this,["refresh"])});this.addButton(this.loading);this.addSeparator();if(this.displayInfo)this.displayEl=Ext.fly(this.el.dom).createChild({cls:"x-paging-info"})}});Ext.namespace("Ext.ux.grid.livegrid");
Ext.ux.grid.livegrid.DragZone=function(a,b){Ext.ux.grid.livegrid.DragZone.superclass.constructor.call(this,a,b);this.view.ds.on("beforeselectionsload",this._onBeforeSelectionsLoad,this);this.view.ds.on("selectionsload",this._onSelectionsLoad,this)};
Ext.extend(Ext.ux.grid.livegrid.DragZone,Ext.grid.GridDragZone,{isDropValid:true,onInitDrag:function(a){this.view.ds.loadSelections(this.grid.selModel.getPendingSelections(true));Ext.ux.grid.livegrid.DragZone.superclass.onInitDrag.call(this,a)},_onBeforeSelectionsLoad:function(){this.isDropValid=false;Ext.fly(this.proxy.el.dom.firstChild).addClass("ext-ux-livegrid-drop-waiting")},_onSelectionsLoad:function(){this.isDropValid=true;this.ddel.innerHTML=this.grid.getDragDropText();Ext.fly(this.proxy.el.dom.firstChild).removeClass("ext-ux-livegrid-drop-waiting")}});
Ext.namespace("Ext.ux.grid.livegrid");
Ext.ux.grid.livegrid.EditorGridPanel=Ext.extend(Ext.grid.EditorGridPanel,{initEvents:function(){Ext.ux.grid.livegrid.EditorGridPanel.superclass.initEvents.call(this);this.view.on("cursormove",this.stopEditing,this,[true])},startEditing:function(a,b){this.stopEditing();if(this.colModel.isCellEditable(b,a)){this.view.ensureVisible(a,b,true);if(!this.store.getAt(a))return}return Ext.ux.grid.livegrid.EditorGridPanel.superclass.startEditing.call(this,a,b)},walkCells:function(a,b,c,d,e){return Ext.ux.grid.livegrid.GridPanel.prototype.walkCells.call(this,
a,b,c,d,e)},onRender:function(a,b){return Ext.ux.grid.livegrid.GridPanel.prototype.onRender.call(this,a,b)},initComponent:function(){if(this.cls)this.cls+=" ext-ux-livegrid";else this.cls="ext-ux-livegrid";return Ext.ux.grid.livegrid.EditorGridPanel.superclass.initComponent.call(this)}});
