FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY CloakAPI.slnx ./
COPY src/ ./src/
RUN dotnet restore ./src/CloakAPI.Api/CloakAPI.Api.csproj
RUN dotnet publish ./src/CloakAPI.Api/CloakAPI.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8081
ENTRYPOINT ["dotnet", "CloakAPI.Api.dll"]
