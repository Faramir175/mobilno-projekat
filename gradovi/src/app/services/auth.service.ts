import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.firebaseConfig.apiKey}`;
  private signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseConfig.apiKey}`;
  private databaseUrl = environment.firebaseConfig.databaseURL; // URL baze podataka

  constructor(private http: HttpClient) {}

  // Registracija sa dodatnim poljima
  register(email: string, password: string, username: string, yearOfBirth: number): Observable<any> {
    return this.http.post(this.signUpUrl, {
      email,
      password,
      returnSecureToken: true,
      
    }).pipe(
      tap((response: any) => {
        if (response && response.idToken) {
          this.storeToken(response.idToken); // Čuvanje tokena
          this.storeEmail(email); // Čuvanje emaila
          this.storeUserData(username, yearOfBirth); // Čuvanje dodatnih podataka
          const userId = response.localId;
          this.saveUserData(userId, username, yearOfBirth);
        }
      })
    );
  }

  saveUserData(userId: string, username:string, yearOfBirth: number):void{
    this.http.put(`${this.databaseUrl}/users/${userId}.json`,{
      username,
      yearOfBirth
    }).subscribe(
      () => console.log('Podaci o korisniku uspešno sačuvani.'),
      error => console.error('Greška prilikom čuvanja podataka: ', error)
    );
  }

  // Prijava korisnika
  login(email: string, password: string): Observable<any> {
    return this.http.post(this.signInUrl, {
      email,
      password,
      returnSecureToken: true
    }).pipe(
      tap((response: any) => {
        if (response && response.idToken) {
          this.storeToken(response.idToken); // Čuvanje tokena
          this.storeEmail(email); // Čuvanje emaila
          const userId = response.localId;
          this.fetchUserData(userId);
        }
      })
    );
  }

  fetchUserData(userId: string) :void{
    this.http.get(`${this.databaseUrl}/users/${userId}.json`).subscribe(
    (userData: any) => {
      if(userData){
        this.storeUserData(userData.username, userData.yearOfBirth);
      }
    },
    error => console.error('Greška prilikom preuzimanja podataka korisnika: ', error)
    );
  }

  // Čuvanje tokena u LocalStorage
  storeToken(token: string): void {
    localStorage.setItem('userToken', token);
  }

  // Čuvanje emaila u LocalStorage
  storeEmail(email: string): void {
    localStorage.setItem('userEmail', email);
  }

  // Čuvanje dodatnih podataka o korisniku
  storeUserData(username: string, yearOfBirth: number): void {
    localStorage.setItem('username', username); // Čuvanje korisničkog imena
    localStorage.setItem('yearOfBirth', yearOfBirth.toString()); // Čuvanje godine rođenja
  }

  // Vraćanje emaila korisnika
  getEmail(): string | null {
    return localStorage.getItem('userEmail');
  }

  // Vraćanje korisničkog imena
  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  // Vraćanje godine rođenja
  getYearOfBirth(): number | null {
    const year = localStorage.getItem('yearOfBirth');
    return year ? +year : null; // Vraća godinu rođenja kao broj
  }

  // Preuzimanje tokena iz LocalStorage
  getToken(): string | null {
    return localStorage.getItem('userToken');
  }

  getUserId(): string | null {
    const userEmail = this.getEmail(); // Ili neki drugi način da dobijete korisnika
    return userEmail ? userEmail.replace(/[@.]/g, '_') : null; // Primer: zamenjuje @ i . za jedinstveni ID
  }
  // Brisanje tokena iz LocalStorage
  removeToken(): void {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userEmail'); // Takođe obrišite email
    localStorage.removeItem('username'); // Obrišite korisničko ime
    localStorage.removeItem('yearOfBirth'); // Obrišite godinu rođenja
  }

  // Proverava da li je korisnik prijavljen
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
