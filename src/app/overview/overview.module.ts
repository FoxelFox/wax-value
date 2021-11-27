import {NgModule} from "@angular/core";
import {OverviewComponent} from "./overview.component";
import {RouterModule} from "@angular/router";

@NgModule({
	imports: [
		RouterModule.forChild([{
			path: '', component: OverviewComponent
		}])
	],
	declarations: [
		OverviewComponent
	]
})
export class OverviewModule {

}
