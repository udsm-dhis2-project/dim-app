import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';
import { uuid } from '@icodebible/utils/uuid';

import { DataEntryField } from 'src/app/shared/models/form.model';
import { AppState } from 'src/app/state/states/app.state';
import { IntegrationState, CreateIntegration } from '../../../state';
import { DIMIntegration } from '../../../models/integration.model';
import { onUpdateFormProps } from 'src/app/shared/utils/form-values-updater.utils';
import {
  getIntegrationCreatedStatus,
  getIntegrationError,
} from '../../../state/integration.selector';
import { OpenSnackBar } from 'src/app/shared/helpers/snackbar.helper';
import { HTTPErrorMessage } from 'src/app/shared/models/http-error.model';

@Component({
  selector: 'app-create-integration',
  templateUrl: './create-integration.component.html',
  styleUrls: ['./create-integration.component.scss'],
})
export class CreateIntegrationComponent implements OnInit, OnDestroy {
  // matcher = new MyErrorStateMatcher();
  integrationFormEntries: DataEntryField = _.clone(_.create());
  isUpdating: boolean;
  subscriptions: Array<Subscription> = [];
  createJobForm: FormGroup = new FormGroup({
    name: new FormControl(''),
    isExecuted: new FormControl(false),
    dataSet: new FormGroup({
      id: new FormControl(''),
      name: new FormControl(''),
    }),
    ou: new FormGroup({
      id: new FormControl(''),
      name: new FormControl(''),
    }),
    description: new FormControl(''),
    defaultCOC: new FormControl(''),
    isAllowed: new FormControl(false),
    importURL: new FormControl(''),
    isUsingHIM: new FormControl(''),
    dataFromURL: new FormControl(''),
    isUsingLiveDhis2: new FormControl(false),
    from: new FormControl(''),
    to: new FormControl(''),
  });

  // Subscriptions
  formSUB$: Subscription;
  integrationCreatedSUB$: Subscription;
  createdIntegrationSUB$: Subscription;
  errorSUB$: Subscription;

  constructor(
    private appState: Store<AppState>,
    private integrationState: Store<IntegrationState>,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.isUpdating = false;
    this.formSUB$ = this.createJobForm.valueChanges.subscribe(
      (integration: DIMIntegration) => {
        this.integrationFormEntries = onUpdateFormProps(
          this.integrationFormEntries,
          integration
        );
      }
    );
    this.subscriptions.push(this.formSUB$);
  }

  ngOnDestroy(): void {
    for (const subscription of this.subscriptions) {
      if (subscription) {
        subscription.unsubscribe();
      }
    }
  }

  onSubmitForm(): void {
    this.isUpdating = true;
    const id = uuid('', 11);
    const integration = _.merge(_.clone(this.integrationFormEntries), {
      id,
    });
    this.integrationState.dispatch(CreateIntegration(_.clone({ integration })));
    this.integrationCreatedSUB$ = this.integrationState
      .pipe(select(getIntegrationCreatedStatus))
      .subscribe((status: boolean) => {
        if (status) {
          this.isUpdating = false;
          this.router.navigate(['../list'], { relativeTo: this.route });
          OpenSnackBar(
            this.snackBar,
            `Integration "${integration?.name}" with id <${integration?.id}> is successfully created`,
            '',
            'success-snackbar'
          );
        }
      });
    this.errorSUB$ = this.integrationState
      .pipe(select(getIntegrationError))
      .subscribe((error: HTTPErrorMessage) => {
        if (error) {
          this.isUpdating = false;
          this.router.navigate(['../../list'], { relativeTo: this.route });
          const message = _.has(error.error, 'message')
            ? error.error.message
            : error.error.error;
          OpenSnackBar(this.snackBar, message, '', 'error-snackbar');
        }
      });
    this.subscriptions.push(this.integrationCreatedSUB$);
    this.subscriptions.push(this.errorSUB$);
  }

  onBack() {
    this.router.navigate(['../list'], { relativeTo: this.route });
  }
}
