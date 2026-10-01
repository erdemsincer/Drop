using System.Collections.Concurrent;
using Drop.Application.Authentication.External;
using Drop.Domain.Users;

namespace Drop.IntegrationTests.Infrastructure;

/// <summary>Stands in for Apple and Google: a test registers a token and the identity it vouches for.</summary>
public sealed class FakeExternalIdentityVerifier : IExternalIdentityVerifier
{
    private readonly ConcurrentDictionary<(ExternalProvider, string), ExternalIdentity> _tokens = new();

    public string Issue(ExternalProvider provider, ExternalIdentity identity)
    {
        var token = $"fake-{provider}-{Guid.NewGuid():N}";
        _tokens[(provider, token)] = identity;
        return token;
    }

    public Task<ExternalIdentity?> VerifyAsync(
        ExternalProvider provider,
        string idToken,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(_tokens.TryGetValue((provider, idToken), out var identity) ? identity : null);
}
