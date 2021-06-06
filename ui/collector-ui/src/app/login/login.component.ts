import { Component, OnInit } from '@angular/core';
import {FormControl, Validators} from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  email = new FormControl('zacdion333@gmail.com', [
    Validators.required,
    Validators.email
  ]);

  password = new FormControl('123456', [
    Validators.required
  ])

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
  }

  submit(){
    const headers = { 'content-type': 'application/json'}  
    this.http.post<any>('http://localhost:9000/login',
      {
        email: this.email.value,
        password: this.password.value
      }, {'headers': headers}).subscribe({
        next: data => {
          debugger
        },

        error: e => {
          debugger
        }
      })
  }

}
