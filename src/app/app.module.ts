import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {FlexLayoutModule} from "@angular/flex-layout";
import {WaxService} from "./wax.service";
import {HttpClientModule} from "@angular/common/http";

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		CommonModule,
		BrowserAnimationsModule,
		MatFormFieldModule,
		FormsModule,
		MatInputModule,
		MatButtonModule,
		MatIconModule,
		FlexLayoutModule,
		HttpClientModule
	],
	providers: [WaxService],
	bootstrap: [AppComponent]
})
export class AppModule {
}
