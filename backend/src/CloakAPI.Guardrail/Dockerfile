FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY CloakAPI.slnx ./
COPY src/ ./src/
RUN dotnet restore ./src/CloakAPI.Guardrail/CloakAPI.Guardrail.csproj
RUN dotnet publish ./src/CloakAPI.Guardrail/CloakAPI.Guardrail.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "CloakAPI.Guardrail.dll"]
