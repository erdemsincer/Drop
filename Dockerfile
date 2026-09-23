# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first so the dependency layer is cached across code changes.
COPY src/Drop.Domain/Drop.Domain.csproj src/Drop.Domain/
COPY src/Drop.Application/Drop.Application.csproj src/Drop.Application/
COPY src/Drop.Infrastructure/Drop.Infrastructure.csproj src/Drop.Infrastructure/
COPY src/Drop.Api/Drop.Api.csproj src/Drop.Api/
RUN dotnet restore src/Drop.Api/Drop.Api.csproj

COPY src/ src/
RUN dotnet publish src/Drop.Api/Drop.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

COPY --from=build /app .

# Non-root user provided by the official .NET images.
USER $APP_UID

ENTRYPOINT ["dotnet", "Drop.Api.dll"]
