import { Component } from '@angular/core';
import {
  ColDef,
  GridReadyEvent,
  Module,
  RowSelectedEvent,
  SelectionChangedEvent
} from 'ag-grid-community';

import { HttpClient } from '@angular/common/http';
import { AppData} from './app.interface';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private http: HttpClient) {
    let self = this;
    // Ctrl-V support
    document.addEventListener("paste", function(event) {
      let clipboardData:any = event.clipboardData;
      let pastedText = clipboardData.getData('text');
      let parsedData = self.getClipboardData(pastedText);
      self.addClipboardDataInGrid(parsedData, true);
    });
    // Ctrl-C support
    document.addEventListener("copy", function(event) {
      let clipboardData:any = event.clipboardData;
      let copiedData = self.getSelectedRowsString();
      clipboardData.setData('text/plain', copiedData);
      event.preventDefault();
    });
    // Ctrl-C support
    document.addEventListener("cut", function(event) {
      let clipboardData:any = event.clipboardData;
      let copiedData = self.getSelectedRowsString();
      clipboardData.setData('text/plain', copiedData);
      self.removeClipboardDataFromGrid();
      event.preventDefault();
    });
   }

  public rowSelection = 'multiple';
  public api: any;

  public columnDefs: ColDef[] = [
    { field: 'athlete', minWidth: 150, checkboxSelection: true },
    { field: 'age', maxWidth: 90 },
    { field: 'country', minWidth: 150 }
  ];

  public rowData: AppData[] = [
    { athlete: 'Toyota', country: 'USA', age: '35' },
    { athlete: 'Ford', country: 'India', age: '32' },
    { athlete: 'Porsche', country: 'England', age: '12' }
  ];

  public defaultColDef: ColDef = {
    flex: 1,
    minWidth: 100,
  };

  // No support for clipboard permissions in @types/web
  async seekCopyPastePermissions() {
    const queryOpts:PermissionDescriptor = { name: 'notifications' };//, allowWithoutGesture: false };
    const permissionStatus = await navigator.permissions.query(queryOpts);
    // Will be 'granted', 'denied' or 'prompt':
    console.log(permissionStatus.state);

    // Listen for changes to the permission state
    permissionStatus.onchange = () => {
      console.log(permissionStatus.state);
    };
  }


  csvToArray(strData: string, strDelimiter: string) {
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");
    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp((
      // Delimiters.
      "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
      // Quoted fields.
      "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
      // Standard fields.
      "([^\"\\" + strDelimiter + "\\r\\n]*))"), "gi");
    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData:[any[]] = [[]];
    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;
    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec(strData)) {
      // Get the delimiter that was found.
      var strMatchedDelimiter = arrMatches[1];
      // Check to see if the given delimiter has a length
      // (is not the start of string) and if it matches
      // field delimiter. If id does not, then we know
      // that this delimiter is a row delimiter.
      if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {
        // Since we have reached a new row of data,
        // add an empty row to our data array.
        arrData.push([]);
      }
      // Now that we have our delimiter out of the way,
      // let's check to see which kind of value we
      // captured (quoted or unquoted).
      if (arrMatches[2]) {
        // We found a quoted value. When we capture
        // this value, unescape any double quotes.
        var strMatchedValue:string = arrMatches[2].replace(
          new RegExp("\"\"", "g"), "\"");
      } else {
        // We found a non-quoted value.
        var strMatchedValue:string = arrMatches[3];
      }
      // Now that we have our value string, let's add
      // it to the data array.
      arrData[arrData.length - 1].push(strMatchedValue);
    }
    // Return the parsed data.
    return (arrData);
  }

  csvArrayToJson(data: [string[]]): AppData[] {
    return data.map(d => { return {athlete: d[0], age: d[1], country: d[2] }});
  }

  // not use
  onPaste(event: ClipboardEvent) {
    let clipboardData = event.clipboardData || { getData: function () { return ''; } };
    let pastedText = clipboardData.getData('text');
    let parsedData = this.getClipboardData(pastedText);
    this.addClipboardDataInGrid(parsedData, true);
  }

  // needs browser clipboard permissions from user
  async paste(isAfterSelection: boolean) {
    let pastedText = await navigator.clipboard.readText();
    let parsedData = this.getClipboardData(pastedText);
    this.addClipboardDataInGrid(parsedData, isAfterSelection);
  }

  // browser copy command demo
  buttonCopyExecCommand() {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.value = this.getSelectedRowsString();
    //input.focus();
    input.select();
    const result = document.execCommand('copy');
    if (result === false) {
      console.error('Failed to copy text.');
    }
    document.body.removeChild(input);
  }
    
  // browser paste command demo - not working
  buttonPasteExecCommand() {
    //let textAreaElement = document.createElement('textarea');
    let textAreaElement:any = document.querySelector("#myText");
    
    // check first the permissions api whether clipboard access is granted
    // fallback to document.execCommand as it is deprecated
    //document.body.appendChild(textAreaElement);
    textAreaElement.focus();
    //textAreaElement.select();
    console.log('pasted from clipboard: ', document.execCommand('paste'));
    console.log(textAreaElement.textContent);
    let text = textAreaElement.value;
    //document.body.removeChild(textAreaElement);
    /*
    let text = '';
    if (navigator.clipboard) {
      text = await navigator.clipboard.readText();
    }
    else if(e.clipboardData != null){
      text = e.clipboardData.getData('text/plain');
    }
    */
    let parsedData = this.getClipboardData(text);
    this.addClipboardDataInGrid(parsedData, true);
  }

  // Clipboard copy demo - working
  async copy() {
    await navigator.clipboard.writeText(this.getSelectedRowsString());
  }

  getClipboardData(pastedText: string): AppData[] {
    console.log("Pasted: ", pastedText);
    let parsedText = this.csvToArray(pastedText, ",");
    let parsedData = this.csvArrayToJson(parsedText);
    return parsedData;
  }

  addClipboardDataInGrid(parsedData: AppData[], isAfterSelection: boolean) {
    console.log('copied csv object array: ', parsedData);
    if(this.api.getSelectedNodes().length == 1) {
      let index = this.api.getSelectedNodes()[0].rowIndex;
      index = isAfterSelection? index + 1 : index;
      parsedData.forEach(p => this.rowData.splice(index++, 0, p));
      this.api.setRowData(this.rowData);
    }
  }

  removeClipboardDataFromGrid() {
    if(this.api.getSelectedNodes().length == 1) {
      let index = this.api.getSelectedNodes()[0].rowIndex;
      this.rowData.splice(index, 1);
      this.api.setRowData(this.rowData);
    }
  }

  getSelectedRows() : AppData[] {
    return this.api.getSelectedRows();
  }

  getSelectedRowsString() : string {
    let selectedData:AppData[] = this.getSelectedRows();
    return this.arraytoCSV(selectedData, ',');
  }

  onInput(content: string) {
    console.log("New content: ", content);
  }

  onRowSelected(event: RowSelectedEvent) {
    console.log(
      'row ' +
      event.node.data.athlete +
      ' selected = ' +
      event.node.isSelected()
    );
  }

  onSelectionChanged(event: SelectionChangedEvent) {
    var rowCount = event.api.getSelectedNodes().length;
    console.log('selection changed, ' + rowCount + ' rows selected');
  }

  onGridReady(params: GridReadyEvent) {
    this.api = params.api;
    this.http
      .get<any[]>('https://www.ag-grid.com/example-assets/olympic-winners.json')
      .subscribe((data) => (this.rowData = data));
  }

  arraytoCSV(csv_arr: AppData[], delim:string) : string
  {
      let dl = ',';
      if (delim) dl = delim
      let master_csv = '';
      csv_arr.forEach(function(k,v){ 
        let cell:string = k.athlete ? k.athlete: '""';
        cell = cell + dl + ('' + k.age ? k.age: '""');
        cell = cell + dl + (k.country ? k.country: '""');
                    
        if (v > 0) {
          master_csv = master_csv + '\n' + cell;         
        } else {
          master_csv = master_csv + cell;         
        }
      })
      return master_csv
  }
}