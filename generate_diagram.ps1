$diagram = @"
%%{init: {'theme': 'dark', 'fontFamily': 'arial'}}%%
sequenceDiagram
    actor Vartotojas
    participant AuthController
    participant AuthService
    participant User

    Vartotojas->>+AuthController: Register(request)
    alt [[Request is valid]]
        AuthController->>+AuthService: RegisterAsync(request)
        AuthService->>+User: <<create>> User(email, passwordHash, role)
        User-->>-AuthService: created User
        AuthService-->>-AuthController: return Success
        AuthController-->>Vartotojas: return "Sėkmingai registruota"
    else [[Validation fails]]
        AuthController-->>-Vartotojas: return ValidationError
    end
"@

$body = @{
    diagram_source = $diagram
    diagram_type = "mermaid"
    output_format = "svg"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://kroki.io/" -Method Post -Body $body -ContentType "application/json" -OutFile "C:\Users\Core_Nvidia\.gemini\antigravity\brain\4fa6ee8d-2a8c-4db8-a5a3-8ac90a10a455\artifacts\diagram.svg"
